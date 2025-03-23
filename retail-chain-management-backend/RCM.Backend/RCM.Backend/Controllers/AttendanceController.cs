using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly RetailChainContext _context;
        private readonly IConfiguration _configuration;

        public AttendanceController(RetailChainContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("CheckIn")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
        {
            if (request == null || request.EmployeeId <= 0)
            {
                return BadRequest("Dữ liệu không hợp lệ.");
            }

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }

            var now = DateTime.Now;
            var currentTime = now.TimeOfDay;

            var morningShiftStart = new TimeSpan(8, 0, 0);    // 8:00
            var morningShiftEnd = new TimeSpan(15, 0, 0);     // 15:00
            var afternoonShiftStart = new TimeSpan(15, 0, 0); // 15:00
            var afternoonShiftEnd = new TimeSpan(22, 0, 0);   // 22:00
            var gracePeriod = new TimeSpan(0, 15, 0);         // 15 phút ân hạn

            string shift;
            string status;
            int lateMinutes = 0;

            // Xác định ca dựa trên giờ hiện tại
            if (currentTime >= morningShiftStart && currentTime < afternoonShiftStart)
            {
                shift = "Ca sáng";
                if (currentTime <= (morningShiftStart + gracePeriod))
                {
                    status = "On Time";
                }
                else
                {
                    status = "Late";
                    lateMinutes = (int)(currentTime - morningShiftStart).TotalMinutes;
                }
            }
            else if (currentTime >= afternoonShiftStart && currentTime <= afternoonShiftEnd)
            {
                shift = "Ca chiều";
                if (currentTime <= (afternoonShiftStart + gracePeriod))
                {
                    status = "On Time";
                }
                else
                {
                    status = "Late";
                    lateMinutes = (int)(currentTime - afternoonShiftStart).TotalMinutes;
                }
            }
            else
            {
                return BadRequest("Ngoài giờ check-in cho phép (8:00-22:00).");
            }

            // Kiểm tra xem đã check-in cho ca này chưa
            var existingCheckIn = await _context.AttendanceCheckIns
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift == shift);

            if (existingCheckIn != null)
            {
                return BadRequest($"Nhân viên đã check-in cho {shift} hôm nay.");
            }

            // Kiểm tra xem có check-in ca khác trong ngày không
            var otherShiftCheckIn = await _context.AttendanceCheckIns
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift != shift);

            // Nếu đã check-in ca khác, kiểm tra quyền làm thêm ca
            if (otherShiftCheckIn != null)
            {
                var approvedOvertime = await _context.OvertimeRecords
                    .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                        && o.Date == now.Date
                        && o.IsApproved == true);

                if (approvedOvertime == null)
                {
                    return BadRequest("Bạn không được cấp quyền làm thêm ca hôm nay. Vui lòng xin phép tăng ca trước.");
                }
            }

            var checkIn = new AttendanceCheckIn
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = shift,
                CheckInTime = now
            };

            _context.AttendanceCheckIns.Add(checkIn);

            // Nếu có quyền tăng ca và đã check-in ca khác, cập nhật bản ghi tăng ca
            if (otherShiftCheckIn != null)
            {
                var approvedOvertime = await _context.OvertimeRecords
                    .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                        && o.Date == now.Date
                        && o.IsApproved == true);

                if (approvedOvertime != null && approvedOvertime.EndTime == TimeSpan.Zero)
                {
                    approvedOvertime.StartTime = currentTime; // Cập nhật thời gian bắt đầu tăng ca
                    approvedOvertime.Reason = $"Check-in lệch ca - {shift}";
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Check-in thành công.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Shift = shift,
                Status = status,
                LateMinutes = lateMinutes > 0 ? lateMinutes : (int?)null,
                CheckInTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                Overtime = otherShiftCheckIn != null ? "Đã ghi nhận tăng ca (dựa trên quyền được phê duyệt)" : "Không tăng ca"
            });
        }
        [HttpPost("CheckOut")]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
        {
            if (request == null || request.EmployeeId <= 0)
            {
                return BadRequest("Dữ liệu không hợp lệ.");
            }

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }

            var now = DateTime.Now;
            var currentTime = now.TimeOfDay;

            var morningShiftEnd = new TimeSpan(15, 0, 0);    // 15:00
            var afternoonShiftEnd = new TimeSpan(22, 0, 0);  // 22:00

            // Tìm bản ghi check-in gần nhất trong ngày
            var checkIn = await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync();

            if (checkIn == null)
            {
                return BadRequest("Bạn chưa check-in trong ngày hôm nay. Vui lòng check-in trước khi check-out.");
            }

            // Kiểm tra xem đã check-out cho ca này chưa
            var existingCheckOut = await _context.AttendanceCheckOuts
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift == checkIn.Shift);

            if (existingCheckOut != null)
            {
                return BadRequest($"Bạn đã check-out cho {checkIn.Shift} hôm nay.");
            }

            // Kiểm tra thời gian check-out hợp lệ
            TimeSpan shiftEnd = checkIn.Shift == "Ca sáng" ? morningShiftEnd : afternoonShiftEnd;
            bool isValidCheckout = currentTime >= shiftEnd;
            decimal overtimeHours = 0;

            if (!isValidCheckout)
            {
                return BadRequest($"Check-out không hợp lệ. Phải sau {(checkIn.Shift == "Ca sáng" ? "15:00" : "22:00")}");
            }

            if (currentTime > shiftEnd)
            {
                overtimeHours = (decimal)(currentTime - shiftEnd).TotalHours;
            }

            var checkOut = new AttendanceCheckOut
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = checkIn.Shift,
                CheckOutTime = now
            };

            _context.AttendanceCheckOuts.Add(checkOut);

            // Kiểm tra và cập nhật bản ghi tăng ca (nếu có)
            var existingOvertime = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                    && o.Date == now.Date
                    && o.EndTime == TimeSpan.Zero);

            if (existingOvertime != null)
            {
                existingOvertime.EndTime = currentTime;
                existingOvertime.TotalHours = (decimal)(currentTime - existingOvertime.StartTime).TotalHours;
            }
            else if (overtimeHours > 0)
            {
                var overtimeRecord = new OvertimeRecord
                {
                    EmployeeId = request.EmployeeId,
                    Date = now.Date,
                    StartTime = shiftEnd,
                    EndTime = currentTime,
                    TotalHours = overtimeHours,
                    Reason = $"Check-out vượt giờ - {checkIn.Shift}",
                    IsApproved = false
                };
                _context.OvertimeRecords.Add(overtimeRecord);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Check-out thành công.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Shift = checkIn.Shift,
                CheckInTime = checkIn.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                OvertimeHours = overtimeHours > 0 || existingOvertime != null
                    ? $"{(existingOvertime?.TotalHours ?? overtimeHours):F2} giờ tăng ca"
                    : "Không tăng ca"
            });
        }
        // API mới: Xin phép tăng ca
        [HttpPost("RequestOvertime")]
        public async Task<IActionResult> RequestOvertime([FromBody] OvertimeRequest request)
        {
            if (request == null || request.EmployeeId <= 0 || request.Date == null || request.TotalHours <= 0)
            {
                return BadRequest("Dữ liệu yêu cầu không hợp lệ.");
            }

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }

            // Kiểm tra xem đã có yêu cầu tăng ca cho ngày này chưa
            var existingRequest = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                    && o.Date == request.Date.Date
                    && o.Reason == request.Reason);

            if (existingRequest != null)
            {
                return BadRequest("Yêu cầu tăng ca cho ngày này đã tồn tại.");
            }

            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date.Date,
                StartTime = request.StartTime ?? TimeSpan.Zero, // Nếu không có giờ bắt đầu cụ thể
                EndTime = TimeSpan.Zero, // Chưa xác định, sẽ cập nhật khi check-out nếu cần
                TotalHours = request.TotalHours,
                Reason = request.Reason ?? "Yêu cầu tăng ca",
                IsApproved = false // Chờ duyệt
            };

            _context.OvertimeRecords.Add(overtimeRecord);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Yêu cầu tăng ca đã được gửi, chờ phê duyệt.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Date = overtimeRecord.Date.ToString("dd/MM/yyyy"),
                TotalHours = overtimeRecord.TotalHours,
                Reason = overtimeRecord.Reason,
                RequestTime = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
            });
        }

        [HttpGet("AttendanceDetail")]
        public async Task<IActionResult> GetAttendance([FromQuery] int employeeId)
        {
            if (employeeId <= 0)
            {
                return BadRequest("Invalid Employee ID.");
            }
            var employee = await _context.Employees.FindAsync(employeeId);
            if(employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }
            var morningShiftStart = new TimeSpan(8, 0, 0);
            var afternoonShiftStart = new TimeSpan(15, 0, 0);
            var gracePeriod = new TimeSpan(0, 15, 0);

            var attendanceRecords = await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == employeeId)
                .GroupJoin(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, coGroup) => new { CheckIn = ci, CheckOuts = coGroup })
                .SelectMany(x => x.CheckOuts.DefaultIfEmpty(), (ci, co) => new
                {
                    AttendanceDate = ci.CheckIn.AttendanceDate, // Keep as DateTime
                    Shift = ci.CheckIn.Shift,
                    CheckInTime = ci.CheckIn.CheckInTime, // Keep as DateTime
                    CheckOutTime = co != null ? co.CheckOutTime : (DateTime?)null, // Keep as DateTime?
                    OnTimeStatus = ci.CheckIn.Shift == "Ca sáng"
                        ? (ci.CheckIn.CheckInTime.TimeOfDay <= morningShiftStart + gracePeriod ? "On Time" : "Late")
                        : (ci.CheckIn.CheckInTime.TimeOfDay <= afternoonShiftStart + gracePeriod ? "On Time" : "Late"),
                    LateMinutes = ci.CheckIn.Shift == "Ca sáng"
                        ? (ci.CheckIn.CheckInTime.TimeOfDay > morningShiftStart + gracePeriod
                            ? (int)(ci.CheckIn.CheckInTime.TimeOfDay - morningShiftStart).TotalMinutes
                            : 0)
                        : (ci.CheckIn.CheckInTime.TimeOfDay > afternoonShiftStart + gracePeriod
                            ? (int)(ci.CheckIn.CheckInTime.TimeOfDay - afternoonShiftStart).TotalMinutes
                            : 0)
                })
                .OrderByDescending(a => a.AttendanceDate) // Order by DateTime directly
                .ThenBy(a => a.Shift)
                .ToListAsync();

            if (attendanceRecords == null || attendanceRecords.Count == 0)
            {
                return NotFound("No attendance records found.");
            }

            // Format the dates after materializing the data
            var formattedRecords = attendanceRecords.Select(a => new
            {
                AttendanceDate = a.AttendanceDate.ToString("dd/MM/yyyy"),
                a.Shift,
                CheckInTime = a.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = a.CheckOutTime?.ToString("dd/MM/yyyy HH:mm:ss"),
                a.OnTimeStatus,
                a.LateMinutes
            });

            return Ok(formattedRecords);
        }
        [HttpGet("AttendanceReport/Range")]
        public async Task<IActionResult> GetAttendanceReportByRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            startDate = startDate.Date;
            endDate = endDate.Date;

            if (startDate > endDate)
                return BadRequest("startDate must be earlier than endDate.");

            var allEmployees = await _context.Employees.ToListAsync();
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

        [HttpGet("GetEmployees")]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _context.Employees
                .Select(e => new
                {
                    e.EmployeeId,
                    e.FullName,
                    BirthDate = e.BirthDate.ToString("dd/MM/yyyy"),
                    e.Gender,
                    e.Phone,
                    e.IdentityNumber,
                    StartDate = e.StartDate.ToString("dd/MM/yyyy")
                })
                .ToListAsync();

            return Ok(employees);
        }

        [HttpGet("CheckAttendanceStatus")]
        public async Task<IActionResult> CheckAttendanceStatus([FromQuery] int employeeId, [FromQuery] string shift)
        {
            if (employeeId <= 0)
            {
                return BadRequest("Invalid Employee ID.");
            }

            if (shift != "Ca sáng" && shift != "Ca chiều")
            {
                return BadRequest("Shift must be 'Ca sáng' or 'Ca chiều'.");
            }

            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }

            var today = DateTime.Today;
            var morningShiftStart = new TimeSpan(8, 0, 0);
            var afternoonShiftStart = new TimeSpan(15, 0, 0);
            var gracePeriod = new TimeSpan(0, 15, 0);

            var checkIn = await _context.AttendanceCheckIns
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId
                    && a.AttendanceDate == today
                    && a.Shift == shift);

            if (checkIn == null)
            {
                return Ok(new
                {
                    Status = "Not Checked In",
                    EmployeeId = employeeId,
                    EmployeeName = employee.FullName,
                    Shift = shift,
                    Message = $"Employee has not checked in for {shift} today."
                });
            }

            var checkOut = await _context.AttendanceCheckOuts
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId
                    && a.AttendanceDate == today
                    && a.Shift == shift);

            var onTimeStatus = checkIn.Shift == "Ca sáng"
                ? (checkIn.CheckInTime.TimeOfDay <= morningShiftStart + gracePeriod ? "On Time" : "Late")
                : (checkIn.CheckInTime.TimeOfDay <= afternoonShiftStart + gracePeriod ? "On Time" : "Late");

            var lateMinutes = checkIn.Shift == "Ca sáng"
                ? (checkIn.CheckInTime.TimeOfDay > morningShiftStart + gracePeriod
                    ? (int)(checkIn.CheckInTime.TimeOfDay - morningShiftStart).TotalMinutes
                    : 0)
                : (checkIn.CheckInTime.TimeOfDay > afternoonShiftStart + gracePeriod
                    ? (int)(checkIn.CheckInTime.TimeOfDay - afternoonShiftStart).TotalMinutes
                    : 0);

            return Ok(new
            {
                Status = checkOut != null ? "Checked Out" : "Checked In",
                EmployeeId = employeeId,
                EmployeeName = employee.FullName,
                AttendanceDate = checkIn.AttendanceDate.ToString("dd/MM/yyyy"),
                Shift = checkIn.Shift,
                CheckInTime = checkIn.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = checkOut?.CheckOutTime.ToString("dd/MM/yyyy HH:mm:ss"),
                OnTimeStatus = onTimeStatus,
                LateMinutes = lateMinutes > 0 ? lateMinutes : (int?)null
            });
        }

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
            public TimeSpan? StartTime { get; set; } // Giờ bắt đầu tăng ca (tùy chọn)
            public decimal TotalHours { get; set; }  // Tổng số giờ dự kiến tăng ca
            public string Reason { get; set; }       // Lý do tăng ca
        }
    }
}