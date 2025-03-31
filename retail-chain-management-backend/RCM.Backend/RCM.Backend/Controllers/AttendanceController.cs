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

            if (!employee.WorkShiftId.HasValue)
            {
                return BadRequest("Nhân viên chưa được setup ca làm việc.");
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
            int? onTime = null;
            bool isOvertimeApproved = false;

            // Kiểm tra xem có yêu cầu tăng ca được phê duyệt không
            var approvedOvertime = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                    && o.Date == now.Date
                    && o.IsApproved == true);

            // Kiểm tra xem đã check-in hôm nay chưa
            var existingCheckInToday = await _context.AttendanceCheckIns
                .AnyAsync(a => a.EmployeeId == request.EmployeeId
                    && a.AttendanceDate == now.Date);

            if (approvedOvertime != null)
            {
                // Nếu có tăng ca được duyệt
                var existingOvertimeCheckIn = await _context.AttendanceCheckIns
                    .AnyAsync(a => a.EmployeeId == request.EmployeeId
                        && a.AttendanceDate == now.Date
                        && a.Shift == "Tăng ca");

                if (existingOvertimeCheckIn)
                {
                    return BadRequest("Bạn đã check-in cho tăng ca hôm nay.");
                }

                isOvertimeApproved = true;
                shift = "Tăng ca";
                status = "On Time";
                onTime = 2; // Tăng ca
            }
            else
            {
                // Nếu không có tăng ca, kiểm tra khung giờ bình thường
                if (existingCheckInToday)
                {
                    return BadRequest("Bạn đã check-in hôm nay. Không thể check-in lại trừ khi có yêu cầu tăng ca được duyệt.");
                }

                if (currentTime >= morningShiftStart && currentTime < afternoonShiftStart)
                {
                    shift = "Ca sáng";
                    if (currentTime <= (morningShiftStart + gracePeriod))
                    {
                        status = "On Time";
                        onTime = 1; // Đúng giờ ca thường
                    }
                    else
                    {
                        status = "Late";
                        onTime = 0; // Trễ ca thường
                    }
                }
                else if (currentTime >= afternoonShiftStart && currentTime <= afternoonShiftEnd)
                {
                    shift = "Ca chiều";
                    if (currentTime <= (afternoonShiftStart + gracePeriod))
                    {
                        status = "On Time";
                        onTime = 1; // Đúng giờ ca thường
                    }
                    else
                    {
                        status = "Late";
                        onTime = 0; // Trễ ca thường
                    }
                }
                else
                {
                    return BadRequest("Ngoài giờ check-in cho phép (6:00-20:00). Vui lòng xin phép tăng ca nếu cần làm ngoài giờ.");
                }

                // Kiểm tra ca làm việc được gán
                string assignedShift = employee.WorkShiftId == 1 ? "Ca sáng" : "Ca chiều";
                if (shift != assignedShift)
                {
                    return BadRequest($"Bạn chỉ được check-in cho {assignedShift}. Vui lòng xin phép tăng ca nếu muốn làm ngoài giờ.");
                }
            }

            var checkIn = new AttendanceCheckIn
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = shift,
                CheckInTime = now,
                OnTime = onTime
            };

            _context.AttendanceCheckIns.Add(checkIn);

            // Cập nhật giờ bắt đầu tăng ca nếu chưa có
            if (isOvertimeApproved && approvedOvertime.StartTime == TimeSpan.Zero)
            {
                approvedOvertime.StartTime = currentTime;
                approvedOvertime.Reason = approvedOvertime.Reason ?? "Check-in tăng ca";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Check-in thành công.",
                EmployeeId = employee.EmployeeId,
                EmployeeName = employee.FullName,
                Shift = shift,
                Status = status,
                CheckInTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                OnTime = onTime == 2 ? "Tăng ca" : (onTime == 1 ? "Đúng giờ" : (onTime == 0 ? "Trễ" : null)),
                Overtime = isOvertimeApproved ? "Check-in theo yêu cầu tăng ca" : "Không tăng ca"
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

            if (!employee.WorkShiftId.HasValue)
            {
                return BadRequest("Nhân viên chưa được setup ca làm việc.");
            }

            var now = DateTime.Now;
            var currentTime = now.TimeOfDay;

            var morningShiftStart = new TimeSpan(6, 0, 0);    // 6:00 AM
            var morningShiftEnd = new TimeSpan(13, 0, 0);     // 1:00 PM
            var afternoonShiftStart = new TimeSpan(13, 0, 0); // 1:00 PM
            var afternoonShiftEnd = new TimeSpan(20, 0, 0);   // 8:00 PM

            // Tìm check-in gần nhất trong ngày
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

            // Kiểm tra yêu cầu tăng ca được phê duyệt
            var approvedOvertime = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                    && o.Date == now.Date
                    && o.IsApproved == true
                    && o.EndTime == TimeSpan.Zero); // Chưa check-out

            bool isOvertimeApproved = approvedOvertime != null;
            string shift = checkIn.Shift;
            string status = "Normal";
            decimal overtimeHours = 0;

            // Xác định thời gian kết thúc ca theo lịch
            TimeSpan shiftEnd = shift switch
            {
                "Ca sáng" => morningShiftEnd,
                "Ca chiều" => afternoonShiftEnd,
                "Tăng ca" => currentTime, // Tăng ca không có giờ kết thúc cố định
                _ => TimeSpan.Zero
            };

            if (now <= checkIn.CheckInTime)
            {
                return BadRequest("Check-out không hợp lệ. Phải sau giờ check-in.");
            }

            if (!isOvertimeApproved && shift != "Tăng ca")
            {
                // Kiểm tra giờ check-out cho ca thường
                if (currentTime < shiftEnd)
                {
                    return BadRequest($"Check-out không hợp lệ. Phải sau {(shift == "Ca sáng" ? "13:00" : "20:00")}.");
                }
                if (currentTime > shiftEnd)
                {
                    overtimeHours = (decimal)(currentTime - shiftEnd).TotalHours;
                    status = "Overtime (Unapproved)";
                }
            }

            var checkOut = new AttendanceCheckOut
            {
                EmployeeId = request.EmployeeId,
                AttendanceDate = now.Date,
                Shift = shift,
                CheckOutTime = now
            };

            _context.AttendanceCheckOuts.Add(checkOut);

            // Xử lý tăng ca
            if (isOvertimeApproved && shift == "Tăng ca")
            {
                approvedOvertime.EndTime = currentTime;
                approvedOvertime.TotalHours = (decimal)(now - checkIn.CheckInTime).TotalHours;
                approvedOvertime.Reason = approvedOvertime.Reason ?? "Check-out tăng ca";
                status = "Overtime (Approved)";
                overtimeHours = approvedOvertime.TotalHours;
            }
            else if (overtimeHours > 0)
            {
                // Ghi nhận tăng ca chưa duyệt nếu vượt giờ ca thường
                var overtimeRecord = new OvertimeRecord
                {
                    EmployeeId = request.EmployeeId,
                    Date = now.Date,
                    StartTime = shiftEnd,
                    EndTime = currentTime,
                    TotalHours = overtimeHours,
                    Reason = $"Check-out vượt giờ - {shift}",
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
                Shift = shift,
                CheckInTime = checkIn.CheckInTime.ToString("dd/MM/yyyy HH:mm:ss"),
                CheckOutTime = now.ToString("dd/MM/yyyy HH:mm:ss"),
                Status = status,
                Overtime = isOvertimeApproved
                    ? $"Tăng ca được duyệt - {FormatTimeSpan(overtimeHours)}"
                    : (overtimeHours > 0 ? $"Tăng ca chưa duyệt - {FormatTimeSpan(overtimeHours)}" : "Không tăng ca")
            });
        }

        // Phương thức hỗ trợ để định dạng thời gian
        private string FormatTimeSpan(decimal hours)
        {
            TimeSpan time = TimeSpan.FromHours((double)hours);
            int hrs = time.Hours;
            int mins = time.Minutes;
            int secs = time.Seconds;
            return $"{hrs:D2}:{mins:D2}:{secs:D2}";
        }
        [HttpPost("RequestOvertime")]
        public async Task<IActionResult> RequestOvertime([FromBody] OvertimeRequest request)
        {
            if (request == null || request.EmployeeId <= 0 || request.Date == null || request.TotalHours <= 0)
            {
                return BadRequest(new { Message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            var employee = await _context.Employees.FindAsync(request.EmployeeId);
            if (employee == null)
            {
                return NotFound(new { Message = "Không tìm thấy nhân viên." });
            }

            // Kiểm tra xem đã có yêu cầu tăng ca nào cho ngày này chưa
            var existingRequest = await _context.OvertimeRecords
                .FirstOrDefaultAsync(o => o.EmployeeId == request.EmployeeId
                    && o.Date == request.Date.Date);

            if (existingRequest != null)
            {
                if (!existingRequest.IsApproved || existingRequest.IsApproved == false)
                {
                    return BadRequest(new { Message = "Bạn đã gửi yêu cầu tăng ca cho ngày này và đang chờ xét duyệt. Vui lòng đợi kết quả trước khi gửi yêu cầu mới." });
                }
                // Nếu đã được duyệt (true) hoặc từ chối (false nhưng đã xử lý), cho phép gửi mới
            }

            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date.Date,
                StartTime = request.StartTime ?? TimeSpan.Zero,
                EndTime = TimeSpan.Zero,
                TotalHours = request.TotalHours,
                Reason = request.Reason ?? "Yêu cầu tăng ca",
                IsApproved = false // Chưa được duyệt
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