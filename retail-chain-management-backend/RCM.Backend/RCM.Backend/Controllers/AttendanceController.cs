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

            var morningShiftStart = new TimeSpan(6, 0, 0);    // 6:00 AM
            var morningShiftEnd = new TimeSpan(13, 0, 0);     // 1:00 PM
            var afternoonShiftStart = new TimeSpan(13, 0, 0); // 1:00 PM
            var afternoonShiftEnd = new TimeSpan(20, 0, 0);   // 8:00 PM
            var gracePeriod = new TimeSpan(0, 15, 0);         // 15-minute grace period

            string shift;
            string status;
            int lateMinutes = 0;

            // Determine shift based on current time
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
                return BadRequest("Ngoài giờ check-in cho phép (6:00-20:00).");
            }

            // Check if already checked in for this shift
            var existingCheckIn = await _context.AttendanceCheckIns
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift == shift);

            if (existingCheckIn != null)
            {
                return BadRequest($"Nhân viên đã check-in cho {shift} hôm nay.");
            }

            // Check if checked in for another shift today
            var otherShiftCheckIn = await _context.AttendanceCheckIns
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift != shift);

            // If checked in for another shift, verify overtime approval
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

            // Update overtime record if applicable
            if (otherShiftCheckIn != null)
            {
                var approvedOvertime = await _context.OvertimeRecords
                    .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                        && o.Date == now.Date
                        && o.IsApproved == true);

                if (approvedOvertime != null && approvedOvertime.EndTime == TimeSpan.Zero)
                {
                    approvedOvertime.StartTime = currentTime;
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

            var morningShiftEnd = new TimeSpan(13, 0, 0);    // 1:00 PM
            var afternoonShiftEnd = new TimeSpan(20, 0, 0);  // 8:00 PM

            // Find the most recent check-in for the day
            var checkIn = await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date)
                .OrderByDescending(a => a.CheckInTime)
                .FirstOrDefaultAsync();

            if (checkIn == null)
            {
                return BadRequest("Bạn chưa check-in trong ngày hôm nay. Vui lòng check-in trước khi check-out.");
            }

            // Check if already checked out for this shift
            var existingCheckOut = await _context.AttendanceCheckOuts
                .FirstOrDefaultAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date
                    && a.Shift == checkIn.Shift);

            if (existingCheckOut != null)
            {
                return BadRequest($"Bạn đã check-out cho {checkIn.Shift} hôm nay.");
            }

            // Validate checkout time
            TimeSpan shiftEnd = checkIn.Shift == "Ca sáng" ? morningShiftEnd : afternoonShiftEnd;
            bool isValidCheckout = currentTime >= shiftEnd;
            decimal overtimeHours = 0;

            if (!isValidCheckout)
            {
                return BadRequest($"Check-out không hợp lệ. Phải sau {(checkIn.Shift == "Ca sáng" ? "13:00" : "20:00")}");
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

            // Handle overtime records
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
                StartTime = request.StartTime ?? TimeSpan.Zero,
                EndTime = TimeSpan.Zero,
                TotalHours = request.TotalHours,
                Reason = request.Reason ?? "Yêu cầu tăng ca",
                IsApproved = false
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

            var morningShiftStart = new TimeSpan(6, 0, 0);    // 6:00 AM
            var afternoonShiftStart = new TimeSpan(13, 0, 0); // 1:00 PM
            var gracePeriod = new TimeSpan(0, 15, 0);

            var attendanceRecords = await _context.AttendanceCheckIns
                .Where(a => a.EmployeeId == employeeId)
                .GroupJoin(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, coGroup) => new { CheckIn = ci, CheckOuts = coGroup })
                .SelectMany(x => x.CheckOuts.DefaultIfEmpty(), (ci, co) => new
                {
                    AttendanceDate = ci.CheckIn.AttendanceDate,
                    Shift = ci.CheckIn.Shift,
                    CheckInTime = ci.CheckIn.CheckInTime,
                    CheckOutTime = co != null ? co.CheckOutTime : (DateTime?)null
                })
                .OrderByDescending(a => a.AttendanceDate)
                .ThenBy(a => a.Shift)
                .ToListAsync();

            if (attendanceRecords == null || attendanceRecords.Count == 0)
            {
                return NotFound("No attendance records found.");
            }

            var formattedRecords = attendanceRecords.Select(a => new
            {
                AttendanceDate = a.AttendanceDate.ToString("dd/MM/yyyy"),
                a.Shift,
                CheckInTime = a.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = a.CheckOutTime?.ToString("dd/MM/yyyy HH:mm:ss"),
                OnTimeStatus = a.Shift == "Ca sáng"
                    ? (a.CheckInTime.TimeOfDay <= morningShiftStart + gracePeriod ? "On Time" : "Late")
                    : (a.CheckInTime.TimeOfDay <= afternoonShiftStart + gracePeriod ? "On Time" : "Late"),
                LateMinutes = a.Shift == "Ca sáng"
                    ? (a.CheckInTime.TimeOfDay > morningShiftStart + gracePeriod
                        ? (int)(a.CheckInTime.TimeOfDay - morningShiftStart).TotalMinutes
                        : 0)
                    : (a.CheckInTime.TimeOfDay > afternoonShiftStart + gracePeriod
                        ? (int)(a.CheckInTime.TimeOfDay - afternoonShiftStart).TotalMinutes
                        : 0)
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
            var morningShiftStart = new TimeSpan(6, 0, 0);    // 6:00 AM
            var afternoonShiftStart = new TimeSpan(13, 0, 0); // 1:00 PM
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
            public TimeSpan? StartTime { get; set; }
            public decimal TotalHours { get; set; }
            public string Reason { get; set; }
        }
    }
}