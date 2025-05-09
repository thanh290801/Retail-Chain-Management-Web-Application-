﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using OfficeOpenXml;

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

            if (status == "Overtime check-in time is outside approved range")
                return BadRequest("Thời gian check-in tăng ca không nằm trong khoảng thời gian đã đề xuất.");

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

            var (status, lateDuration) = await ProcessCheckOutLogic(checkIn, now);
            if (status == "Overtime checkout time is outside approved range")
                return BadRequest("Thời gian check-out tăng ca không nằm trong khoảng thời gian đã đề xuất.");

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
            // Kiểm tra dữ liệu đầu vào cơ bản
            if (request == null || request.EmployeeId <= 0)
                return BadRequest(new { Message = "Dữ liệu yêu cầu không hợp lệ." });

            // Tìm nhân viên
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId);

            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            // Kiểm tra xem nhân viên đã gửi yêu cầu tăng ca trong ngày đó chưa
            var existingOvertimeRequest = await _context.OvertimeRecords
                .AnyAsync(o => o.Date == request.Date.Date
                    && o.EmployeeId == request.EmployeeId);

            if (existingOvertimeRequest)
                return BadRequest(new { Message = "Bạn đã gửi yêu cầu tăng ca cho ngày này rồi." });

            // Tạo bản ghi tăng ca
            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date.Date,
                StartTime = request.StartTime ?? TimeSpan.Zero,
                EndTime = TimeSpan.Zero,
                TotalHours = request.TotalHours > 0 ? request.TotalHours : 1,
                IsRejected = false,
                Reason = request.Reason ?? "Yêu cầu tăng ca",
                IsApproved = false
            };

            await _context.OvertimeRecords.AddAsync(overtimeRecord);

            // Thêm thông báo cho nhân viên
            if (_context.Notifications != null && employee.AccountId.HasValue && employee.AccountId.Value != 0)
            {
                var employeeNotification = new Notification
                {
                    Title = "Yêu cầu tăng ca",
                    Message = $"Yêu cầu tăng ca của bạn ngày {request.Date:dd/MM/yyyy} đã được gửi, đang chờ phê duyệt",
                    ReceiverAccountId = employee.AccountId.Value,
                    CreatedAt = DateTime.Now,
                    IsRead = false
                };
                await _context.Notifications.AddAsync(employeeNotification);
            }

            // Thêm thông báo cho Owner
            var owner = await _context.Employees
                .FirstOrDefaultAsync(e => e.Account.Role == "Owner"); // Giả định có trường Role để xác định Owner

            if (owner != null && owner.AccountId.HasValue && owner.AccountId.Value != 0)
            {
                var ownerNotification = new Notification
                {
                    Title = "Yêu cầu tăng ca mới",
                    Message = $"Nhân viên {employee.FullName} đã gửi yêu cầu tăng ca ngày {request.Date:dd/MM/yyyy}, đang chờ phê duyệt",
                    ReceiverAccountId = owner.AccountId.Value,
                    CreatedAt = DateTime.Now,
                    IsRead = false
                };
                await _context.Notifications.AddAsync(ownerNotification);
            }

            // Lưu thay đổi vào database
            await _context.SaveChangesAsync();

            // Trả về phản hồi thành công
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

        [HttpGet("AttendanceReport/Range")]
        public async Task<IActionResult> GetAttendanceReportByRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            startDate = startDate.Date;
            endDate = endDate.Date;

            if (startDate > endDate)
                return BadRequest("startDate must be earlier than endDate.");

            var allEmployees = await _context.Employees.Where(e => e.Account.Role !="Owner").ToListAsync();
            var checkIns = await _context.AttendanceCheckIns
                .Where(a => a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
                .Include(a => a.Employee)
                .ToListAsync();
            var checkOuts = await _context.AttendanceCheckOuts
                .Where(a => a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
                .ToListAsync();

            var dateRangeReport = new Dictionary<DateTime, object>();

            for (DateTime currentDate = startDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
            {
                var attendedRecords = checkIns
                    .Where(a => a.AttendanceDate.Date == currentDate)
                    .Select(a => new
                    {
                        a.Employee.EmployeeId,
                        a.Employee.FullName,
                        AttendanceDate = a.AttendanceDate.ToString("dd/MM/yyyy"),
                        a.Employee.Phone,
                        a.Employee.BirthDate,
                        a.Shift,
                        CheckInTime = a.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                        CheckOutTime = checkOuts
                            .FirstOrDefault(co => co.EmployeeId == a.EmployeeId
                                && co.AttendanceDate.Date == currentDate
                                && co.Shift == a.Shift)?.CheckOutTime.ToString("dd/MM/yyyy HH:mm:ss"),
                        Status = "Attended"
                    })
                    .ToList();

                var attendedEmployeeShifts = attendedRecords
                    .Select(a => $"{a.EmployeeId}-{a.Shift}")
                    .ToHashSet();

                var notAttendedEmployees = allEmployees
                    .SelectMany(e => new[] { "Ca sáng", "Ca chiều" }
                        .Where(shift => !attendedEmployeeShifts.Contains($"{e.EmployeeId}-{shift}"))
                        .Select(shift => new
                        {
                            e.EmployeeId,
                            e.FullName,
                            e.BirthDate,
                            e.ProfileImage,
                            Shift = shift,
                            CheckInTime = (string)null,
                            CheckOutTime = (string)null,
                            Status = "Not Attended"
                        }))
                    .ToList();

                dateRangeReport[currentDate] = new
                {
                    Date = currentDate.ToString("dd/MM/yyyy"),
                    AttendedRecords = attendedRecords,
                    NotAttendedRecords = notAttendedEmployees
                };
            }

            return Ok(dateRangeReport);
        }
        [HttpGet("AttendanceReport/Range/Export")]
        public async Task<IActionResult> ExportAttendanceReportByRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            startDate = startDate.Date;
            endDate = endDate.Date;

            if (startDate > endDate)
                return BadRequest("startDate must be earlier than endDate.");

            // Lấy dữ liệu
            var allEmployees = await _context.Employees.Where(e => e.Account.Role != "Owner").ToListAsync();
            var checkIns = await _context.AttendanceCheckIns
                .Where(a => a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
                .Include(a => a.Employee)
                .ToListAsync();
            var checkOuts = await _context.AttendanceCheckOuts
                .Where(a => a.AttendanceDate >= startDate && a.AttendanceDate <= endDate)
                .ToListAsync();
            var overtimeRecords = await _context.OvertimeRecords
                .Where(o => o.Date >= startDate && o.Date <= endDate && o.IsApproved)
                .ToListAsync();

            // Sử dụng EPPlus để tạo file Excel
            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Attendance Report");

                // Thiết lập header
                worksheet.Cells[1, 1].Value = "Ngày";
                worksheet.Cells[1, 2].Value = "Mã NV";
                worksheet.Cells[1, 3].Value = "Họ Tên";
                worksheet.Cells[1, 4].Value = "Ca";
                worksheet.Cells[1, 5].Value = "Giờ Check In";
                worksheet.Cells[1, 6].Value = "Giờ Check Out";
                worksheet.Cells[1, 7].Value = "Trạng Thái";
                worksheet.Cells[1, 8].Value = "Giờ Tăng Ca"; // Cột mới cho giờ tăng ca

                int row = 2;

                // Lặp qua từng ngày trong khoảng thời gian
                for (DateTime currentDate = startDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
                {
                    // Dữ liệu nhân viên có mặt
                    var attendedRecords = checkIns
                        .Where(a => a.AttendanceDate.Date == currentDate)
                        .Select(a => new
                        {
                            a.Employee.EmployeeId,
                            a.Employee.FullName,
                            AttendanceDate = a.AttendanceDate,
                            a.Shift,
                            CheckInTime = a.CheckInTime,
                            CheckOutTime = checkOuts
                                .FirstOrDefault(co => co.EmployeeId == a.EmployeeId
                                    && co.AttendanceDate.Date == currentDate
                                    && co.Shift == a.Shift)?.CheckOutTime,
                            Overtime = overtimeRecords
                                .FirstOrDefault(o => o.EmployeeId == a.EmployeeId
                                    && o.Date == currentDate && o.IsApproved)
                        });

                    foreach (var record in attendedRecords)
                    {
                        worksheet.Cells[row, 1].Value = record.AttendanceDate.ToString("dd/MM/yyyy");
                        worksheet.Cells[row, 2].Value = record.EmployeeId;
                        worksheet.Cells[row, 3].Value = record.FullName;
                        worksheet.Cells[row, 4].Value = record.Shift;
                        worksheet.Cells[row, 5].Value = record.CheckInTime.ToString("HH:mm:ss");
                        worksheet.Cells[row, 6].Value = record.CheckOutTime?.ToString("HH:mm:ss") ?? "";
                        worksheet.Cells[row, 7].Value = "Attended";

                        // Thêm thông tin giờ tăng ca
                        worksheet.Cells[row, 8].Value = record.Overtime != null
                            ? $"{record.Overtime.TotalHours} giờ"
                            : "";
                        row++;
                    }

                    // Dữ liệu nhân viên không có mặt
                    var attendedEmployeeShifts = attendedRecords
                        .Select(a => $"{a.EmployeeId}-{a.Shift}")
                        .ToHashSet();

                    var notAttendedEmployees = allEmployees
                        .SelectMany(e => new[] { "Ca sáng", "Ca chiều" }
                            .Where(shift => !attendedEmployeeShifts.Contains($"{e.EmployeeId}-{shift}"))
                            .Select(shift => new
                            {
                                e.EmployeeId,
                                e.FullName,
                                Shift = shift,
                                Overtime = overtimeRecords
                                    .FirstOrDefault(o => o.EmployeeId == e.EmployeeId
                                        && o.Date == currentDate && o.IsApproved)
                            }));

                    foreach (var employee in notAttendedEmployees)
                    {
                        worksheet.Cells[row, 1].Value = currentDate.ToString("dd/MM/yyyy");
                        worksheet.Cells[row, 2].Value = employee.EmployeeId;
                        worksheet.Cells[row, 3].Value = employee.FullName;
                        worksheet.Cells[row, 4].Value = employee.Shift;
                        worksheet.Cells[row, 5].Value = "";
                        worksheet.Cells[row, 6].Value = "";
                        worksheet.Cells[row, 7].Value = "Not Attended";

                        // Thêm thông tin giờ tăng ca (nếu có)
                        worksheet.Cells[row, 8].Value = employee.Overtime != null
                            ? $"{employee.Overtime.TotalHours} giờ"
                            : "";
                        row++;
                    }
                }

                // Định dạng bảng
                worksheet.Cells[1, 1, 1, 8].Style.Font.Bold = true; // Cập nhật range để bao gồm cột mới
                worksheet.Cells.AutoFitColumns();

                // Xuất file
                var stream = new MemoryStream(package.GetAsByteArray());
                string fileName = $"Attendance_Report_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.xlsx";

                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
        }
        [HttpGet("AttendanceDetail")]
        public async Task<IActionResult> GetAttendance([FromQuery] int employeeId)
        {
            if (employeeId <= 0)
                return BadRequest(new { Message = "Invalid Employee ID." });

            var records = await GetAttendanceRecords(employeeId);

            // Nếu không có bản ghi nào, trả về bản ghi mặc định cho ngày hiện tại
            if (!records.Any())
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);

                if (employee == null)
                    return NotFound(new { Message = "Employee not found." });

                // Lấy ca làm việc mặc định của nhân viên
                string defaultShift = employee.WorkShiftId == 1 ? "Ca sáng" : "Ca chiều";
                int workShiftId = employee.WorkShiftId ?? 1; // Mặc định là ca sáng nếu null

                var defaultRecord = new
                {
                    attendanceDate = DateTime.Now.ToString("dd/MM/yyyy"), // Ngày hiện tại
                    shift = defaultShift,
                    checkInTime = (DateTime?)null,
                    checkOutTime = (DateTime?)null,
                    status = (string)null,
                    lateDuration = (TimeSpan?)null,
                    workShiftId = workShiftId
                };

                return Ok(new List<object> { defaultRecord });
            }

            // Nếu có bản ghi, định dạng và trả về
            var result = records.Select(FormatAttendanceRecord).ToList();
            return Ok(result);
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

                TimeSpan overtimeStart = (overtime.StartTime != TimeSpan.Zero)
    ? overtime.StartTime
    : (workShiftId == 1 ? TimeSpan.FromHours(14) : TimeSpan.FromHours(22));

                TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                if (currentTime < overtimeStart || currentTime > overtimeEnd)
                    return ("Tăng ca", "Overtime check-in time is outside approved range", TimeSpan.Zero, false);

                TimeSpan lateDuration = currentTime > overtimeStart ? currentTime - overtimeStart : TimeSpan.Zero;
                string status = lateDuration == TimeSpan.Zero ? "On Time" : "Late";

                return ("Tăng ca", status, lateDuration, true);
            }

            TimeSpan regularLateDuration = currentTime > regularShiftStart ? currentTime - regularShiftStart : TimeSpan.Zero;
            bool isOnTime = regularLateDuration == TimeSpan.Zero;

            return (regularShiftName, isOnTime ? "On Time" : "Late", regularLateDuration, false);
        }

        private async Task<(string status, TimeSpan lateDuration)> ProcessCheckOutLogic(AttendanceCheckIn checkIn, DateTime now)
        {
            TimeSpan currentTime = now.TimeOfDay;

            if (checkIn.Shift == "Tăng ca")
            {
                var overtime = await _context.OvertimeRecords
                    .FirstOrDefaultAsync(o => o.EmployeeId == checkIn.EmployeeId
                        && o.Date == now.Date
                        && o.IsApproved);

                if (overtime != null)
                {
                    TimeSpan overtimeStart = overtime?.StartTime != TimeSpan.Zero
    ? overtime.StartTime
    : TimeSpan.FromHours(14);


                    TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                    if (currentTime < overtimeStart || currentTime > overtimeEnd)
                        return ("Overtime checkout time is outside approved range", TimeSpan.Zero);

                    TimeSpan lateDuration = currentTime < overtimeEnd ? overtimeEnd - currentTime : TimeSpan.Zero;
                    string status = lateDuration == TimeSpan.Zero ? "On Time" : "Early";

                    return (status, lateDuration);
                }
            }

            TimeSpan shiftEndTime = checkIn.Shift == "Ca sáng" ? TimeSpan.FromHours(14) :
                                   checkIn.Shift == "Ca chiều" ? TimeSpan.FromHours(22) :
                                   TimeSpan.FromHours(24);

            TimeSpan lateDurationRegular = currentTime < shiftEndTime ? shiftEndTime - currentTime : TimeSpan.Zero;
            string statusRegular = lateDurationRegular == TimeSpan.Zero ? "On Time" : "Early";

            return (statusRegular, lateDurationRegular);
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

            return records ?? new List<AttendanceRecord>(); // Trả về danh sách rỗng nếu null
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