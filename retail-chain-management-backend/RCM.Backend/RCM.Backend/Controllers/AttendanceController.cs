using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly RetailChainContext _context;
        private readonly IConfiguration _configuration;
        private static readonly TimeSpan MorningShiftStart = TimeSpan.FromHours(6); // 6:00 AM
        private static readonly TimeSpan AfternoonShiftStart = TimeSpan.FromHours(14); // 2:00 PM

        public AttendanceController(RetailChainContext context, IConfiguration configuration)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        [HttpPost("CheckIn")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
        {
            if (!ModelState.IsValid || request?.EmployeeId <= 0)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId);
            if (employee == null)
                return NotFound("Không tìm thấy nhân viên.");

            if (!employee.WorkShiftId.HasValue || (employee.WorkShiftId != 1 && employee.WorkShiftId != 2))
                return BadRequest("Nhân viên chưa được setup ca làm việc hợp lệ.");

            var now = DateTime.Now;
            var currentTime = now.TimeOfDay;

            var (shift, status, lateDuration, isOvertimeApproved) = await ProcessCheckInLogic(
                request.EmployeeId, employee.WorkShiftId.Value, now, currentTime);

            if (status == "Already checked in for this shift")
                return BadRequest($"Bạn đã check-in cho {shift} trong ngày hôm nay.");

            if (status == "Overtime already approved for another employee today")
                return BadRequest("Đã có nhân viên khác được duyệt tăng ca hôm nay.");

            if (status == "Cannot overtime during regular shift")
                return BadRequest("Không thể check-in tăng ca trong giờ ca chính.");

            var checkIn = new AttendanceCheckIn
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = shift,
                CheckInTime = now,
                OnTime = status == "On Time" ? 1 : 0
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.AttendanceCheckIns.Add(checkIn);

                if (isOvertimeApproved)
                {
                    var overtime = await _context.OvertimeRecords
                        .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                            && o.Date == now.Date
                            && o.IsApproved);
                    if (overtime != null && overtime.StartTime == TimeSpan.Zero)
                    {
                        overtime.StartTime = currentTime;
                        overtime.Reason ??= "Check-in tăng ca";
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "Lỗi khi lưu dữ liệu check-in.", Error = ex.Message });
            }

            return Ok(new
            {
                Message = "Check-in thành công.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Shift = shift,
                Status = status,
                CheckInTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                LateDuration = lateDuration > TimeSpan.Zero ? $"{lateDuration.Hours:D2}:{lateDuration.Minutes:D2}:{lateDuration.Seconds:D2}" : null,
                Overtime = isOvertimeApproved ? "Check-in theo yêu cầu tăng ca" : "Không tăng ca"
            });
        }

        [HttpPost("CheckOut")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
        {
            if (!ModelState.IsValid || request?.EmployeeId <= 0)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            var now = DateTime.Now;
            var checkIn = await GetLatestCheckIn(request.EmployeeId, now.Date);
            if (checkIn == null)
                return BadRequest(new { Message = "Bạn chưa check-in trong ngày hôm nay." });

            var checkOutCount = await _context.AttendanceCheckOuts
                .CountAsync(a => a.EmployeeId == request.EmployeeId && a.AttendanceDate == now.Date);

            if (await HasExistingCheckOut(request.EmployeeId, now.Date, checkIn.Shift))
                return BadRequest(new { Message = $"Bạn đã check-out cho {checkIn.Shift} hôm nay." });

            var hasOvertime = await _context.OvertimeRecords
                .AnyAsync(o => o.EmployeeId == request.EmployeeId && o.Date == now.Date && o.IsApproved);

            if (checkOutCount >= 1 && !hasOvertime)
                return BadRequest(new { Message = "Chỉ được check-out một lần mỗi ngày trừ khi có tăng ca." });

            if (checkOutCount >= 2)
                return BadRequest(new { Message = "Đã đạt tối đa số lần check-out trong ngày." });

            var (status, lateDuration) = ProcessCheckOutLogic(checkIn, now);

            var checkOut = new AttendanceCheckOut
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = checkIn.Shift,
                CheckOutTime = now
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.AttendanceCheckOuts.Add(checkOut);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "Lỗi khi lưu dữ liệu check-out.", Error = ex.Message });
            }

            return Ok(new
            {
                Message = "Check-out thành công.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Shift = checkIn.Shift,
                CheckInTime = checkIn.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                Status = status,
                LateDuration = lateDuration > TimeSpan.Zero ? $"{lateDuration.Hours:D2}:{lateDuration.Minutes:D2}:{lateDuration.Seconds:D2}" : null
            });
        }

        [HttpPost("RequestOvertime")]
        public async Task<IActionResult> RequestOvertime([FromBody] OvertimeRequest request)
        {
            if (!ModelState.IsValid || request?.EmployeeId <= 0 || request.TotalHours <= 0)
                return BadRequest(new { Message = "Dữ liệu yêu cầu không hợp lệ." });

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            // Kiểm tra xem nhân viên hiện tại đã có đơn tăng ca được duyệt cho ngày đó chưa
            var existingEmployeeOvertime = await _context.OvertimeRecords
                .AnyAsync(o => o.Date == request.Date.Date
                    && o.IsApproved // Chỉ kiểm tra các đơn đã duyệt
                    && o.EmployeeId == request.EmployeeId);

            if (existingEmployeeOvertime)
                return BadRequest(new { Message = "Bạn đã được duyệt tăng ca trong ngày hôm đó." });

            // Kiểm tra xem đã có nhân viên khác được duyệt tăng ca cho ngày đó chưa
            var existingApprovedOvertime = await _context.OvertimeRecords
                .AnyAsync(o => o.Date == request.Date.Date
                    && o.IsApproved // Chỉ kiểm tra các đơn đã duyệt
                    && o.EmployeeId != request.EmployeeId);

            if (existingApprovedOvertime)
                return BadRequest(new { Message = "Đã có nhân viên khác được duyệt tăng ca cho ngày này." });

            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date.Date,
                StartTime = request.StartTime ?? TimeSpan.Zero,
                EndTime = TimeSpan.Zero,
                TotalHours = request.TotalHours,
                Reason = request.Reason ?? "Yêu cầu tăng ca", // Lý do ban đầu của nhân viên
                IsApproved = false // Trạng thái "Chưa duyệt"
            };

            await _context.OvertimeRecords.AddAsync(overtimeRecord);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Yêu cầu tăng ca đã được gửi, chờ phê duyệt.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Date = overtimeRecord.Date.ToString("dd/MM/yyyy"),
                TotalHours = overtimeRecord.TotalHours,
                Reason = overtimeRecord.Reason
            });
        }
        [HttpGet("AttendanceDetail")]
        public async Task<IActionResult> GetAttendance([FromQuery] int employeeId)
        {
            if (employeeId <= 0)
                return BadRequest(new { Message = "Invalid Employee ID." });

            var records = await GetAttendanceRecords(employeeId);
            // Trả về mảng rỗng nếu không có bản ghi, thay vì lỗi 404
            return Ok(records.Select(FormatAttendanceRecord).ToList());
        }

        #region Helper Methods
        private async Task<(string shift, string status, TimeSpan lateDuration, bool isOvertimeApproved)> ProcessCheckInLogic(
            int employeeId, int workShiftId, DateTime now, TimeSpan currentTime)
        {
            string regularShiftName = workShiftId == 1 ? "Ca sáng" : "Ca chiều";
            TimeSpan regularShiftStart = workShiftId == 1 ? MorningShiftStart : AfternoonShiftStart;
            TimeSpan regularShiftEnd = workShiftId == 1 ? TimeSpan.FromHours(14) : TimeSpan.FromHours(22);

            if (await _context.AttendanceCheckIns.AnyAsync(a => a.EmployeeId == employeeId
                && a.AttendanceDate == now.Date
                && a.Shift == regularShiftName))
                return (regularShiftName, "Already checked in for this shift", TimeSpan.Zero, false);

            var overtime = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == employeeId
                    && o.Date == now.Date
                    && o.IsApproved);

            if (overtime != null)
            {
                if (await _context.AttendanceCheckIns.AnyAsync(a => a.EmployeeId == employeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift == "Tăng ca"))
                    return ("Tăng ca", "Already checked in for this shift", TimeSpan.Zero, false);

                var existingApprovedOvertime = await _context.OvertimeRecords
                    .AnyAsync(o => o.Date == now.Date
                        && o.IsApproved
                        && o.EmployeeId != employeeId);

                if (existingApprovedOvertime)
                    return (regularShiftName, "Overtime already approved for another employee today", TimeSpan.Zero, false);

                bool isDuringRegularShift = (currentTime >= regularShiftStart && currentTime <= regularShiftEnd);
                if (isDuringRegularShift)
                    return (regularShiftName, "Cannot overtime during regular shift", TimeSpan.Zero, false);

                TimeSpan overtimeStart = workShiftId == 1 ? TimeSpan.FromHours(12) : TimeSpan.FromHours(22);
                TimeSpan overtimeEnd = workShiftId == 1 ? TimeSpan.FromHours(22) : TimeSpan.FromHours(12);

                bool isValidOvertimeTime;
                if (workShiftId == 2)
                {
                    isValidOvertimeTime = currentTime >= TimeSpan.FromHours(22) || currentTime <= TimeSpan.FromHours(12);
                }
                else
                {
                    isValidOvertimeTime = currentTime >= TimeSpan.FromHours(12) && currentTime <= TimeSpan.FromHours(22);
                }

                if (!isValidOvertimeTime)
                    return ("Tăng ca", "Overtime check-in time is not allowed for your shift", TimeSpan.Zero, false);

                TimeSpan overtimeStartTime = overtime.StartTime ?? TimeSpan.Zero;
                TimeSpan lateDuration = currentTime > overtimeStartTime ? currentTime - overtimeStartTime : TimeSpan.Zero;
                string status = lateDuration == TimeSpan.Zero ? "On Time" : "Late";

                return ("Tăng ca", status, lateDuration, true);
            }

            TimeSpan regularLateDuration = currentTime > regularShiftStart ? currentTime - regularShiftStart : TimeSpan.Zero;
            bool isOnTime = regularLateDuration == TimeSpan.Zero;

            return (regularShiftName, isOnTime ? "On Time" : "Late", regularLateDuration, false);
        }

        private (string status, TimeSpan lateDuration) ProcessCheckOutLogic(AttendanceCheckIn checkIn, DateTime now)
        {
            TimeSpan shiftEndTime = checkIn.Shift == "Ca sáng" ? TimeSpan.FromHours(14) :
                                   checkIn.Shift == "Ca chiều" ? TimeSpan.FromHours(22) :
                                   TimeSpan.FromHours(24);

            TimeSpan currentTime = now.TimeOfDay;
            TimeSpan lateDuration = currentTime < shiftEndTime ? shiftEndTime - currentTime : TimeSpan.Zero;
            string status = lateDuration == TimeSpan.Zero ? "On Time" : "Early";

            return (status, lateDuration);
        }

        private async Task<AttendanceCheckIn?> GetLatestCheckIn(int employeeId, DateTime date)
        {
            return await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == employeeId && a.AttendanceDate == date)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync();
        }

        private async Task<bool> HasExistingCheckOut(int employeeId, DateTime date, string shift)
        {
            return await _context.AttendanceCheckOuts
                .AnyAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == date && a.Shift == shift);
        }

        private async Task<List<AttendanceRecord>> GetAttendanceRecords(int employeeId)
        {
            var records = await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == employeeId)
                .Join(_context.Employees,
                    ci => ci.EmployeeId,
                    e => e.EmployeeId,
                    (ci, e) => new { CheckIn = ci, Employee = e })
                .GroupJoin(_context.AttendanceCheckOuts,
                    ci => new { ci.CheckIn.EmployeeId, ci.CheckIn.AttendanceDate, ci.CheckIn.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, coGroup) => new { ci.CheckIn, ci.Employee, CheckOuts = coGroup })
                .SelectMany(x => x.CheckOuts.DefaultIfEmpty(), (ci, co) => new AttendanceRecord
                {
                    AttendanceDate = ci.CheckIn.AttendanceDate,
                    Shift = ci.CheckIn.Shift,
                    CheckInTime = ci.CheckIn.CheckInTime,
                    CheckOutTime = co != null ? co.CheckOutTime : null,
                    WorkShiftId = ci.Employee.WorkShiftId
                })
                .OrderByDescending(a => a.AttendanceDate)
                .ThenBy(a => a.Shift)
                .ToListAsync();

            return records;
        }

        private object FormatAttendanceRecord(AttendanceRecord a)
        {
            TimeSpan shiftStart = a.Shift == "Ca sáng" ? MorningShiftStart :
                                 a.Shift == "Ca chiều" ? AfternoonShiftStart :
                                 TimeSpan.Zero;
            TimeSpan lateDuration = a.Shift == "Tăng ca" || a.CheckInTime.TimeOfDay <= shiftStart
                ? TimeSpan.Zero
                : a.CheckInTime.TimeOfDay - shiftStart;
            string status = a.Shift == "Tăng ca" ? "Overtime" : (lateDuration == TimeSpan.Zero ? "On Time" : "Late");

            return new
            {
                AttendanceDate = a.AttendanceDate.ToString("dd/MM/yyyy"),
                Shift = a.Shift,
                CheckInTime = a.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = a.CheckOutTime.HasValue ? a.CheckOutTime.Value.ToString("dd/MM/yyyy HH:mm:ss") : null,
                Status = status,
                LateDuration = lateDuration > TimeSpan.Zero ? $"{lateDuration.Hours:D2}:{lateDuration.Minutes:D2}:{lateDuration.Seconds:D2}" : null,
                WorkShiftId = a.WorkShiftId
            };
        }
        #endregion

        #region Helper Class
        private class AttendanceRecord
        {
            public DateTime AttendanceDate { get; set; }
            public string Shift { get; set; }
            public DateTime CheckInTime { get; set; }
            public DateTime? CheckOutTime { get; set; }
            public int? WorkShiftId { get; set; }
        }
        #endregion

        #region Request Models
        public class CheckInRequest
        {
            public int EmployeeId { get; set; }
        }

        public class CheckOutRequest
        {
            public int EmployeeId { get; set; }
        }

        public class OvertimeRequest
        {
            public int EmployeeId { get; set; }
            public DateTime Date { get; set; }
            public TimeSpan? StartTime { get; set; }
            public decimal TotalHours { get; set; }
            public string? Reason { get; set; }
        }
        #endregion
    }
}