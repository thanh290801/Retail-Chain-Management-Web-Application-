using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTO;
using RCM.Backend.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayrollController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public PayrollController(RetailChainContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpPost("setup-shifts")]
        public async Task<IActionResult> SetupShifts([FromBody] ShiftSettingDTO request)
        {
            if (request.TotalShifts <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000)
                return BadRequest("Dữ liệu không hợp lệ.");

            var existingSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == request.Month && s.Year == request.Year);

            if (existingSetting != null)
            {
                existingSetting.TotalShifts = request.TotalShifts;
            }
            else
            {
                _context.ShiftSettings.Add(new ShiftSetting
                {
                    Month = request.Month,
                    Year = request.Year,
                    TotalShifts = request.TotalShifts
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Đã thiết lập {request.TotalShifts} ca cho tháng {request.Month}/{request.Year}" });
        }

        [HttpPost("getAllPayroll")]
        public async Task<IActionResult> CalculateAndSavePayroll(
            [FromQuery] string? staffId,
            [FromQuery] string? search,
            [FromQuery] int month,
            [FromQuery] int year)
        {
            if (month < 1 || month > 12 || year < 1)
                return BadRequest("Tháng hoặc năm không hợp lệ.");

            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var shiftSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var employeesQuery = _context.Employees.AsNoTracking().Where(e => e.Account.Role != "Owner"); ;
            if (!string.IsNullOrEmpty(search))
                employeesQuery = employeesQuery.Where(e => e.FullName.Contains(search) || e.Phone.Contains(search));
            if (!string.IsNullOrEmpty(staffId))
                employeesQuery = employeesQuery.Where(e => e.EmployeeId.ToString() == staffId);

            var employees = await employeesQuery.ToListAsync();
            if (!employees.Any())
                return Ok(new { Message = "Không tìm thấy nhân viên nào.", Data = new List<object>() });

            var salaryRecords = new List<object>();
            var currentDate = DateTime.Now;

            TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            DateTime vietnamDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            var previousMonthDate = vietnamDate.AddMonths(-1);
            var autoPaymentDate = new DateTime(vietnamDate.Year, vietnamDate.Month, 4);
            bool isAutoPaymentDay = vietnamDate.Date == autoPaymentDate.Date && month == previousMonthDate.Month && year == previousMonthDate.Year;

            foreach (var employee in employees)
            {
                var employeeId = employee.EmployeeId;

                var attendanceData = await _context.AttendanceCheckIns
                    .Where(ci => ci.EmployeeId == employeeId &&
                                 ci.AttendanceDate.Month == month &&
                                 ci.AttendanceDate.Year == year &&
                                 ci.Shift != "Tăng ca")
                    .Join(_context.AttendanceCheckOuts,
                        ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                        co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                        (ci, co) => new
                        {
                            ci.AttendanceDate,
                            ci.Shift,
                            ci.CheckInTime,
                            co.CheckOutTime
                        })
                    .ToListAsync();

                int totalWorkDays = attendanceData
                    .GroupBy(x => x.AttendanceDate)
                    .Count();

                var shiftDetails = attendanceData.Select(x => new ShiftDetail
                {
                    Date = x.AttendanceDate,
                    Shift = x.Shift,
                    CheckIn = x.CheckInTime,
                    CheckOut = x.CheckOutTime
                }).ToList();

                decimal totalOvertimeHours = 0;
                var overtimeRecords = await _context.OvertimeRecords
                    .Where(o => o.EmployeeId == employeeId &&
                                o.Date.Month == month &&
                                o.Date.Year == year &&
                                o.IsApproved == true)
                    .ToListAsync();

                foreach (var overtime in overtimeRecords)
                {
                    var overtimeCheckIn = await _context.AttendanceCheckIns
                        .FirstOrDefaultAsync(ci => ci.EmployeeId == employeeId &&
                                                  ci.AttendanceDate == overtime.Date &&
                                                  ci.Shift == "Tăng ca");

                    var overtimeCheckOut = await _context.AttendanceCheckOuts
                        .FirstOrDefaultAsync(co => co.EmployeeId == employeeId &&
                                                  co.AttendanceDate == overtime.Date &&
                                                  co.Shift == "Tăng ca");

                    if (overtimeCheckIn != null && overtimeCheckOut != null)
                    {
                        TimeSpan overtimeStart = overtime.StartTime ?? TimeSpan.FromHours(14);
                        TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                        var checkInTime = overtimeCheckIn.CheckInTime.TimeOfDay;
                        var checkOutTime = overtimeCheckOut.CheckOutTime.TimeOfDay;

                        var effectiveStart = checkInTime < overtimeStart ? overtimeStart : checkInTime;
                        var effectiveEnd = checkOutTime > overtimeEnd ? overtimeEnd : checkOutTime;

                        if (effectiveEnd > effectiveStart)
                        {
                            var overtimeDuration = effectiveEnd - effectiveStart;
                            totalOvertimeHours += (decimal)overtimeDuration.TotalHours;
                        }
                    }
                }

                decimal fixedSalary = employee.FixedSalary ?? 0;
                decimal overtimeRate = employee.OvertimeRate ?? 50000; // Sử dụng OvertimeRate từ Employee
                decimal salaryPerShift = totalShiftsInMonth > 0 ? fixedSalary / totalShiftsInMonth : 0;
                decimal baseSalary = salaryPerShift * totalWorkDays;
                decimal overtimePay = totalOvertimeHours * overtimeRate;
                decimal finalSalary = baseSalary + overtimePay;

                var existingSalary = await _context.Salaries
                    .FirstOrDefaultAsync(s => s.EmployeeId == employeeId &&
                                             s.StartDate.HasValue &&
                                             s.StartDate.Value.Month == month &&
                                             s.StartDate.Value.Year == year);

                if (existingSalary != null)
                {
                    existingSalary.FixedSalary = (int)fixedSalary;
                    existingSalary.BonusSalary = existingSalary.BonusSalary ?? 0;
                    existingSalary.FinalSalary = (int)finalSalary;
                    existingSalary.WorkingDays = totalWorkDays;
                    existingSalary.BonusHours = (int)totalOvertimeHours;
                    existingSalary.SalaryPerShift = (int)salaryPerShift;
                    existingSalary.StartDate = startDate;
                    existingSalary.EndDate = endDate;
                    existingSalary.UpdateAt = currentDate;
                    existingSalary.IsCalculated = true;
                }
                else
                {
                    existingSalary = new Salary
                    {
                        EmployeeId = employeeId,
                        FixedSalary = (int)fixedSalary,
                        BonusSalary = 0,
                        FinalSalary = (int)finalSalary,
                        StartDate = startDate,
                        EndDate = endDate,
                        WorkingDays = totalWorkDays,
                        BonusHours = (int)totalOvertimeHours,
                        SalaryPerShift = (int)salaryPerShift,
                        UpdateAt = currentDate,
                        IsCalculated = true
                    };
                    _context.Salaries.Add(existingSalary);
                }

                var paymentHistories = await _context.SalaryPaymentHistories
                    .Where(p => p.EmployeeId == employeeId &&
                                p.PaymentDate.HasValue &&
                                p.PaymentDate.Value.Month == month &&
                                p.PaymentDate.Value.Year == year &&
                                p.IsDeleted == false)
                    .ToListAsync();

                decimal totalPaid = paymentHistories.Sum(p => p.PaidAmount);
                decimal remainingAmount = finalSalary - totalPaid;
                string paymentStatus = totalWorkDays == 0 && totalOvertimeHours == 0 ? "Chưa tính toán" :
                                      remainingAmount <= 0 ? "Đã thanh toán" : "Chưa thanh toán";

                if (paymentStatus == "Chưa thanh toán" && isAutoPaymentDay && finalSalary > 0)
                {
                    var paymentHistory = new SalaryPaymentHistory
                    {
                        EmployeeId = employeeId,
                        SalaryId = existingSalary.SalaryId,
                        PaymentDate = vietnamDate,
                        PaidAmount = (int)remainingAmount,
                        Note = $"Thanh toán tự động lương tháng {month}/{year} vào ngày 4/{vietnamDate.Month}/{vietnamDate.Year}",
                        IsDeleted = false
                    };
                    _context.SalaryPaymentHistories.Add(paymentHistory);
                    paymentStatus = "Đã thanh toán";
                }

                salaryRecords.Add(new
                {
                    EmployeeId = employeeId,
                    EmployeeName = employee.FullName,
                    Phone = employee.Phone,
                    FixedSalary = fixedSalary,
                    SalaryPerShift = (int)salaryPerShift,
                    TotalWorkDays = totalWorkDays,
                    TotalShiftInMonth = totalShiftsInMonth,
                    TotalOvertimeHours = (int)totalOvertimeHours,
                    OvertimeRate = overtimeRate,
                    OvertimePay = (int)overtimePay,
                    FinalSalary = existingSalary.FinalSalary ?? (int)finalSalary,
                    Shifts = shiftDetails,
                    IdentityNumber = employee.IdentityNumber,
                    Hometown = employee.Hometown,
                    UpdateAt = existingSalary.UpdateAt,
                    PaymentStatus = paymentStatus
                });
            }

            await _context.SaveChangesAsync();
            return Ok(salaryRecords);
        }

        [HttpPost("setEmployeeSalary")]
        public async Task<IActionResult> SetEmployeeSalary([FromBody] SetSalaryRequestDTO request)
        {
            // Kiểm tra dữ liệu đầu vào
            if (request == null || request.EmployeeId <= 0)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            if (request.FixedSalary.HasValue && request.FixedSalary < 0)
                return BadRequest(new { Message = "Lương cố định không thể âm." });

            // Tìm nhân viên trong database
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            // Kiểm tra xem nhân viên đã có lịch sử thanh toán lương chưa
            var hasPaidSalaries = await _context.SalaryPaymentHistories
                .AnyAsync(p => p.EmployeeId == request.EmployeeId && p.IsDeleted == false);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Nếu có yêu cầu cập nhật lương cố định
                if (request.FixedSalary.HasValue)
                {
                    // Nếu chưa có lịch sử thanh toán, cho phép thay đổi lương
                    if (!hasPaidSalaries)
                    {
                        employee.FixedSalary = (int)request.FixedSalary.Value;
                    }
                    // Nếu đã có lịch sử thanh toán, không thay đổi lương nhưng vẫn trả về thành công
                    else if (request.FixedSalary.Value != employee.FixedSalary)
                    {
                        return Ok(new
                        {
                            Message = "Lương cố định không được thay đổi vì đã có tháng lương được thanh toán.",
                            EmployeeId = employee.EmployeeId,
                            EmployeeName = employee.FullName,
                            FixedSalary = employee.FixedSalary // Giữ nguyên lương cũ
                        });
                    }
                    // Nếu lương yêu cầu giống lương hiện tại, không cần thay đổi
                }

                // Lưu thay đổi vào database (nếu có)
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Trả về phản hồi thành công
                return Ok(new
                {
                    Message = "Thiết lập lương cố định thành công.",
                    EmployeeId = employee.EmployeeId,
                    EmployeeName = employee.FullName,
                    FixedSalary = employee.FixedSalary
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "Lỗi khi thiết lập lương.", Error = ex.Message });
            }
        }

        [HttpPost("setEmployeeOvertimeRate")]
        public async Task<IActionResult> SetEmployeeOvertimeRate([FromBody] SetOvertimeRateRequestDTO request)
        {
            // Kiểm tra dữ liệu đầu vào
            if (request == null || request.EmployeeId <= 0)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            if (request.OvertimeRate < 0)
                return BadRequest(new { Message = "Số tiền tăng ca theo giờ không thể âm." });

            // Tìm nhân viên trong database
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == request.EmployeeId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            // Kiểm tra lịch sử thanh toán lương
            var hasPaidSalaries = await _context.SalaryPaymentHistories
                .AnyAsync(p => p.EmployeeId == request.EmployeeId && !p.IsDeleted);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Xử lý yêu cầu cập nhật số tiền tăng ca theo giờ
                if (!hasPaidSalaries)
                {
                    // Nếu chưa có lịch sử thanh toán, cho phép thay đổi
                    employee.OvertimeRate = request.OvertimeRate;
                }
                else if (request.OvertimeRate != employee.OvertimeRate)
                {
                    // Nếu đã có lịch sử thanh toán và giá trị mới khác giá trị cũ, không thay đổi
                    return Ok(new
                    {
                        Message = "Số tiền tăng ca theo giờ không được thay đổi vì đã có lịch sử thanh toán lương.",
                        EmployeeId = employee.EmployeeId,
                        EmployeeName = employee.FullName,
                        OvertimeRate = employee.OvertimeRate // Giữ nguyên giá trị cũ
                    });
                }
                // Trường hợp giá trị mới bằng giá trị cũ: không cần thay đổi, tiếp tục lưu

                // Lưu thay đổi vào database (nếu có)
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Trả về phản hồi thành công
                return Ok(new
                {
                    Message = "Thiết lập số tiền tăng ca theo giờ thành công.",
                    EmployeeId = employee.EmployeeId,
                    EmployeeName = employee.FullName,
                    OvertimeRate = employee.OvertimeRate
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    Message = "Lỗi khi thiết lập số tiền tăng ca theo giờ.",
                    Error = ex.Message
                });
            }
        }

        [HttpPost("getSalaryList")]
        public async Task<IActionResult> GetSalaryList(
            [FromQuery] string? search,
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            var salaryList = _context.Salaries.AsQueryable();

            if (month.HasValue && year.HasValue)
                salaryList = salaryList.Where(a => a.StartDate.HasValue &&
                                                  a.StartDate.Value.Month == month &&
                                                  a.StartDate.Value.Year == year);

            if (!string.IsNullOrEmpty(search))
                salaryList = salaryList.Where(s => s.Employee.FullName.Contains(search) || s.Employee.Phone.Contains(search));

            var result = await salaryList
                .Select(s => new
                {
                    s.SalaryId,
                    s.EmployeeId,
                    s.Employee.FullName,
                    s.FixedSalary,
                    s.BonusSalary,
                    s.Penalty,
                    s.FinalSalary,
                    s.StartDate,
                    s.EndDate,
                    s.WorkingDays,
                    s.BonusHours
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpPost("add-to-salary-record")]
        public async Task<IActionResult> AddToSalaryRecord([FromBody] AddSalaryRequestDTO request)
        {
            if (request.StaffId <= 0 || request.FixedSalary < 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000)
                return BadRequest(new { Message = "Dữ liệu không hợp lệ." });

            var hasReceivedSalary = await _context.SalaryPaymentHistories
                .AnyAsync(p => p.EmployeeId == request.StaffId &&
                               p.PaymentDate.HasValue &&
                               p.PaymentDate.Value.Month == request.Month &&
                               p.PaymentDate.Value.Year == request.Year &&
                               p.IsDeleted == false);

            if (hasReceivedSalary)
                return BadRequest(new { Message = "Không thể thêm lương vì lương tháng này đã được thanh toán." });

            var employee = await _context.Employees.FindAsync(request.StaffId);
            if (employee == null)
                return NotFound(new { Message = "Không tìm thấy nhân viên." });

            var shiftSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == request.Month && s.Year == request.Year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var attendanceData = await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == request.StaffId &&
                            ci.AttendanceDate.Month == request.Month &&
                            ci.AttendanceDate.Year == request.Year)
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new { ci.AttendanceDate, ci.Shift, ci.CheckInTime, co.CheckOutTime })
                .ToListAsync();

            int totalWorkDays = attendanceData
                .GroupBy(x => x.AttendanceDate)
                .Count();

            decimal totalOvertimeHours = 0;
            var overtimeRecords = await _context.OvertimeRecords
                .Where(o => o.EmployeeId == request.StaffId &&
                            o.Date.Month == request.Month &&
                            o.Date.Year == request.Year &&
                            o.IsApproved == true)
                .ToListAsync();

            foreach (var overtime in overtimeRecords)
            {
                var overtimeCheckIn = await _context.AttendanceCheckIns
                    .FirstOrDefaultAsync(ci => ci.EmployeeId == request.StaffId &&
                                              ci.AttendanceDate == overtime.Date &&
                                              ci.Shift == "Tăng ca");

                var overtimeCheckOut = await _context.AttendanceCheckOuts
                    .FirstOrDefaultAsync(co => co.EmployeeId == request.StaffId &&
                                              co.AttendanceDate == overtime.Date &&
                                              co.Shift == "Tăng ca");

                if (overtimeCheckIn != null && overtimeCheckOut != null)
                {
                    TimeSpan overtimeStart = overtime.StartTime ?? TimeSpan.FromHours(14);
                    TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                    var checkInTime = overtimeCheckIn.CheckInTime.TimeOfDay;
                    var checkOutTime = overtimeCheckOut.CheckOutTime.TimeOfDay;

                    var effectiveStart = checkInTime < overtimeStart ? overtimeStart : checkInTime;
                    var effectiveEnd = checkOutTime > overtimeEnd ? overtimeEnd : checkOutTime;

                    if (effectiveEnd > effectiveStart)
                    {
                        var overtimeDuration = effectiveEnd - effectiveStart;
                        totalOvertimeHours += (decimal)overtimeDuration.TotalHours;
                    }
                }
            }

            decimal overtimeRate = employee.OvertimeRate ?? 50000;
            decimal salaryPerShift = totalShiftsInMonth > 0 ? request.FixedSalary / totalShiftsInMonth : 0;
            decimal baseSalary = salaryPerShift * totalWorkDays;
            decimal overtimePay = totalOvertimeHours * overtimeRate;
            decimal finalSalary = baseSalary + request.BonusSalary - request.PenaltyAmount + overtimePay;

            var startDate = new DateTime(request.Year, request.Month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var payrollExists = await _context.Salaries
                .FirstOrDefaultAsync(s => s.EmployeeId == request.StaffId &&
                                         s.StartDate.HasValue &&
                                         s.StartDate.Value.Month == request.Month &&
                                         s.StartDate.Value.Year == request.Year);

            if (payrollExists != null)
            {
                payrollExists.UpdateAt = DateTime.Now;
                payrollExists.WorkingDays = totalWorkDays;
                payrollExists.FixedSalary = request.FixedSalary;
                payrollExists.StartDate = startDate;
                payrollExists.EndDate = endDate;
                payrollExists.SalaryPerShift = (int)salaryPerShift;
                payrollExists.BonusSalary = request.BonusSalary;
                payrollExists.Penalty = request.PenaltyAmount;
                payrollExists.BonusHours = (int)totalOvertimeHours;
                payrollExists.FinalSalary = (int)finalSalary;
            }
            else
            {
                var salaryRecords = new Salary
                {
                    UpdateAt = DateTime.Now,
                    EmployeeId = request.StaffId,
                    WorkingDays = totalWorkDays,
                    FixedSalary = request.FixedSalary,
                    StartDate = startDate,
                    EndDate = endDate,
                    SalaryPerShift = (int)salaryPerShift,
                    BonusSalary = request.BonusSalary,
                    Penalty = request.PenaltyAmount,
                    BonusHours = (int)totalOvertimeHours,
                    FinalSalary = (int)finalSalary
                };
                _context.Salaries.Add(salaryRecords);
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã thêm vào danh sách lương cho nhân viên" });
        }

        [HttpGet("details")]
        public async Task<IActionResult> GetPayrollDetails(
            [FromQuery] int employeeId,
            [FromQuery] int month,
            [FromQuery] int year)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var shiftSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var salaryRecord = await _context.Salaries
                .Where(s => s.EmployeeId == employeeId &&
                            s.StartDate.HasValue &&
                            s.StartDate.Value.Month == month &&
                            s.StartDate.Value.Year == year)
                .Select(s => new
                {
                    s.SalaryId,
                    s.EmployeeId,
                    s.FixedSalary,
                    s.BonusSalary,
                    s.Penalty,
                    s.FinalSalary,
                    s.StartDate,
                    s.EndDate,
                    s.WorkingDays,
                    s.BonusHours,
                    Employee = new
                    {
                        s.Employee.EmployeeId,
                        s.Employee.FullName,
                        s.Employee.Phone,
                        s.Employee.IdentityNumber,
                        s.Employee.Hometown,
                        s.Employee.FixedSalary,
                        s.Employee.OvertimeRate
                    }
                })
                .FirstOrDefaultAsync();

            if (salaryRecord == null)
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
                if (employee == null)
                    return NotFound("Không tìm thấy nhân viên.");

                return Ok(new
                {
                    EmployeeId = employeeId,
                    EmployeeName = employee.FullName,
                    Phone = employee.Phone,
                    FixedSalary = employee.FixedSalary ?? 0,
                    SalaryPerShift = 0,
                    TotalWorkDays = 0,
                    TotalShiftInMonth = totalShiftsInMonth,
                    TotalOvertimeHours = 0,
                    OvertimeRate = employee.OvertimeRate ?? 50000,
                    OvertimePay = 0,
                    TotalSalary = 0,
                    Shifts = new List<object>(),
                    IdentityNumber = employee.IdentityNumber,
                    Hometown = employee.Hometown,
                    PaymentStatus = "Chưa tính toán",
                    PaymentHistory = new List<object>()
                });
            }

            var attendanceData = await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == employeeId &&
                            ci.AttendanceDate.Month == month &&
                            ci.AttendanceDate.Year == year &&
                            ci.Shift != "Tăng ca")
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new
                    {
                        ci.AttendanceDate,
                        ci.Shift,
                        ci.CheckInTime,
                        co.CheckOutTime
                    })
                .ToListAsync();

            int totalWorkDays = attendanceData
                .GroupBy(x => x.AttendanceDate)
                .Count();

            var shiftDetails = attendanceData.Select(x => new ShiftDetail
            {
                Date = x.AttendanceDate,
                Shift = x.Shift,
                CheckIn = x.CheckInTime,
                CheckOut = x.CheckOutTime
            }).ToList();

            decimal totalOvertimeHours = 0;
            var overtimeRecords = await _context.OvertimeRecords
                .Where(o => o.EmployeeId == employeeId &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .ToListAsync();

            foreach (var overtime in overtimeRecords)
            {
                var overtimeCheckIn = await _context.AttendanceCheckIns
                    .FirstOrDefaultAsync(ci => ci.EmployeeId == employeeId &&
                                              ci.AttendanceDate == overtime.Date &&
                                              ci.Shift == "Tăng ca");

                var overtimeCheckOut = await _context.AttendanceCheckOuts
                    .FirstOrDefaultAsync(co => co.EmployeeId == employeeId &&
                                              co.AttendanceDate == overtime.Date &&
                                              co.Shift == "Tăng ca");

                if (overtimeCheckIn != null && overtimeCheckOut != null)
                {
                    TimeSpan overtimeStart = overtime.StartTime ?? TimeSpan.FromHours(14);
                    TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                    var checkInTime = overtimeCheckIn.CheckInTime.TimeOfDay;
                    var checkOutTime = overtimeCheckOut.CheckOutTime.TimeOfDay;

                    var effectiveStart = checkInTime < overtimeStart ? overtimeStart : checkInTime;
                    var effectiveEnd = checkOutTime > overtimeEnd ? overtimeEnd : checkOutTime;

                    if (effectiveEnd > effectiveStart)
                    {
                        var overtimeDuration = effectiveEnd - effectiveStart;
                        totalOvertimeHours += (decimal)overtimeDuration.TotalHours;
                    }
                }
            }

            decimal overtimeRate = salaryRecord.Employee.OvertimeRate ?? 50000;
            decimal overtimePay = totalOvertimeHours * overtimeRate;
            decimal salaryPerShift = totalShiftsInMonth > 0 ? (salaryRecord.FixedSalary ?? 0) / totalShiftsInMonth : 0;
            decimal baseSalary = salaryPerShift * totalWorkDays;
            decimal finalSalary = baseSalary + (salaryRecord.BonusSalary ?? 0) - (salaryRecord.Penalty ?? 0) + overtimePay;

            var paymentHistories = await _context.SalaryPaymentHistories
                .Where(p => p.EmployeeId == employeeId &&
                            p.PaymentDate.HasValue &&
                            p.PaymentDate.Value.Month == month &&
                            p.PaymentDate.Value.Year == year &&
                            p.IsDeleted == false)
                .Select(p => new
                {
                    p.PaymentDate,
                    p.PaidAmount,
                    p.Note
                })
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            decimal totalPaid = paymentHistories.Sum(p => p.PaidAmount);
            decimal remainingAmount = finalSalary - totalPaid;
            string paymentStatus = totalWorkDays == 0 && totalOvertimeHours == 0 ? "Chưa tính toán" :
                                  remainingAmount <= 0 ? "Đã thanh toán" : "Chưa thanh toán";

            var result = new
            {
                EmployeeId = salaryRecord.EmployeeId,
                EmployeeName = salaryRecord.Employee.FullName,
                Phone = salaryRecord.Employee.Phone,
                FixedSalary = salaryRecord.FixedSalary ?? 0,
                SalaryPerShift = (int)salaryPerShift,
                TotalWorkDays = totalWorkDays,
                TotalShiftInMonth = totalShiftsInMonth,
                TotalOvertimeHours = (int)totalOvertimeHours,
                OvertimeRate = overtimeRate,
                OvertimePay = (int)overtimePay,
                BonusSalary = salaryRecord.BonusSalary ?? 0,
                Penalty = salaryRecord.Penalty ?? 0,
                TotalSalary = salaryRecord.FinalSalary ??
            (int)finalSalary,
                Shifts = shiftDetails,
                IdentityNumber = salaryRecord.Employee.IdentityNumber,
                Hometown = salaryRecord.Employee.Hometown,
                PaymentStatus = paymentStatus,
                PaymentHistory = paymentHistories
            };

            return Ok(result);
        }
        [HttpGet("export")]
        public async Task<IActionResult> ExportPayroll([FromQuery] int month, [FromQuery] int year)
        {
            var shiftSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            // Lấy dữ liệu cơ bản từ Salaries và chuyển sang client-side evaluation
            var salaries = await _context.Salaries
                .Include(s => s.Employee)
                .Where(s => s.StartDate.HasValue &&
                           s.StartDate.Value.Month == month &&
                           s.StartDate.Value.Year == year &&
                           s.Employee.Account.Role != "Owner")
                .AsNoTracking()
                .ToListAsync();

            // Nhóm và lấy bản ghi mới nhất trong bộ nhớ
            var payrollList = salaries
                .GroupBy(s => s.EmployeeId)
                .Select(g => g.OrderByDescending(s => s.UpdateAt).FirstOrDefault())
                .Select(s => new
                {
                    s.Employee.FullName,
                    FixedSalary = s.FixedSalary ?? 0,
                    BonusSalary = s.BonusSalary ?? 0,
                    Penalty = s.Penalty ?? 0,
                    TotalWorkDays = _context.AttendanceCheckIns
                        .Where(ci => ci.EmployeeId == s.EmployeeId &&
                                    ci.AttendanceDate.Month == month &&
                                    ci.AttendanceDate.Year == year)
                        .Join(_context.AttendanceCheckOuts,
                            ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                            co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                            (ci, co) => new { ci.AttendanceDate })
                        .Distinct()
                        .Count(),
                    TotalOvertimeHours = s.BonusHours ?? 0,
                    OvertimeRate = s.Employee.OvertimeRate ?? 50000,
                    TotalSalary = s.FinalSalary ?? 0,
                    PaidAmount = _context.SalaryPaymentHistories
                        .Where(p => p.EmployeeId == s.EmployeeId &&
                                   p.PaymentDate.HasValue &&
                                   p.PaymentDate.Value.Month == month &&
                                   p.PaymentDate.Value.Year == year &&
                                   p.IsDeleted == false)
                        .Sum(p => p.PaidAmount),
                    ProfileImage = s.Employee.ProfileImage
                })
                .ToList();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Bảng lương");
            var headers = new string[]
            {
        "Ảnh đại diện", "Họ và tên", "Lương cố định", "Lương mỗi ca",
        "Tổng ngày làm", "Giờ tăng ca", "Tiền tăng ca (VNĐ/giờ)", "Tiền tăng ca",
        "Tiền thưởng", "Tổng lương", "Số tiền đã trả", "Ký tên"
            };

            // Thêm tiêu đề và định dạng
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightGray;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            }

            // Đặt chiều cao dòng và chiều rộng cột cho ảnh
            worksheet.Row(1).Height = 20;
            worksheet.Column(1).Width = 15;

            int row = 2;
            foreach (var p in payrollList)
            {
                decimal salaryPerShift = totalShiftsInMonth > 0 ? p.FixedSalary / totalShiftsInMonth : 0;
                decimal overtimePay = p.TotalOvertimeHours * p.OvertimeRate;
                string signature = (p.PaidAmount >= p.TotalSalary && p.TotalSalary > 0) ? p.FullName : ""; // Thay "Đã thanh toán" bằng "Đã ký"

                // Chèn ảnh đại diện nếu có ProfileImage
                if (!string.IsNullOrEmpty(p.ProfileImage))
                {
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", p.ProfileImage.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        try
                        {
                            var imageBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                            var image = worksheet.AddPicture(new MemoryStream(imageBytes))
                                .MoveTo(worksheet.Cell(row, 1))
                                .WithSize(50, 50);
                            worksheet.Row(row).Height = 50;
                        }
                        catch (Exception ex)
                        {
                            worksheet.Cell(row, 1).Value = "";
                            Console.WriteLine($"Lỗi khi chèn ảnh cho {p.FullName}: {ex.Message}");
                        }
                    }
                    else
                    {
                        worksheet.Cell(row, 1).Value = "";
                    }
                }
                else
                {
                    worksheet.Cell(row, 1).Value = "";
                }

                // Ghi dữ liệu các cột khác và định dạng
                worksheet.Cell(row, 2).Value = p.FullName;
                worksheet.Cell(row, 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 3).Value = p.FixedSalary;
                worksheet.Cell(row, 3).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 4).Value = salaryPerShift;
                worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 5).Value = p.TotalWorkDays;
                worksheet.Cell(row, 5).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 6).Value = p.TotalOvertimeHours;
                worksheet.Cell(row, 6).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(row, 7).Value = p.OvertimeRate;
                worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 7).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 8).Value = overtimePay;
                worksheet.Cell(row, 8).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 8).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 9).Value = p.BonusSalary;
                worksheet.Cell(row, 9).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 9).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 10).Value = p.TotalSalary;
                worksheet.Cell(row, 10).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 10).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 11).Value = p.PaidAmount;
                worksheet.Cell(row, 11).Style.NumberFormat.Format = "#,##0 VNĐ";
                worksheet.Cell(row, 11).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                worksheet.Cell(row, 12).Value = signature;
                worksheet.Cell(row, 12).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                row++;
            }

            // Thêm viền cho toàn bộ bảng
            var range = worksheet.Range(1, 1, row - 1, headers.Length);
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

            // Tự động điều chỉnh chiều rộng cột (trừ cột ảnh)
            for (int col = 2; col <= headers.Length; col++)
            {
                worksheet.Column(col).AdjustToContents();
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"BangLuong_{month}_{year}.xlsx");
        }
        [HttpPut("update-salary")]
        public async Task<IActionResult> UpdateSalaryByEmployeeIdAndMonth([FromBody] SalaryDTO request)
        {
            if (request == null || request.EmployeeId <= 0 || request.StartDate == null)
                return BadRequest("Dữ liệu yêu cầu không hợp lệ.");

            int month = request.StartDate.Value.Month;
            int year = request.StartDate.Value.Year;

            var hasReceivedSalary = await _context.SalaryPaymentHistories
                .AnyAsync(p => p.EmployeeId == request.EmployeeId &&
                               p.PaymentDate.HasValue &&
                               p.PaymentDate.Value.Month == month &&
                               p.PaymentDate.Value.Year == year &&
                               p.IsDeleted == false);

            if (hasReceivedSalary && request.FixedSalary.HasValue)
                return BadRequest("Không thể cập nhật FixedSalary vì lương tháng này đã được thanh toán.");

            var salaryRecord = await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                         s.StartDate.HasValue &&
                                         s.StartDate.Value.Month == month &&
                                         s.StartDate.Value.Year == year);

            if (salaryRecord == null)
                return NotFound("Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho.");

            var shiftSetting = await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            int totalWorkDays = await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == request.EmployeeId &&
                            ci.AttendanceDate.Month == month &&
                            ci.AttendanceDate.Year == year &&
                            ci.Shift != "Tăng ca")
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new { ci.AttendanceDate })
                .Distinct()
                .CountAsync();

            decimal totalOvertimeHours = 0;
            var overtimeRecords = await _context.OvertimeRecords
                .Where(o => o.EmployeeId == request.EmployeeId &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .ToListAsync();

            foreach (var overtime in overtimeRecords)
            {
                var overtimeCheckIn = await _context.AttendanceCheckIns
                    .FirstOrDefaultAsync(ci => ci.EmployeeId == request.EmployeeId &&
                                              ci.AttendanceDate == overtime.Date &&
                                              ci.Shift == "Tăng ca");

                var overtimeCheckOut = await _context.AttendanceCheckOuts
                    .FirstOrDefaultAsync(co => co.EmployeeId == request.EmployeeId &&
                                              co.AttendanceDate == overtime.Date &&
                                              co.Shift == "Tăng ca");

                if (overtimeCheckIn != null && overtimeCheckOut != null)
                {
                    TimeSpan overtimeStart = overtime.StartTime ?? TimeSpan.FromHours(14);
                    TimeSpan overtimeEnd = overtimeStart + TimeSpan.FromHours((double)overtime.TotalHours);

                    var checkInTime = overtimeCheckIn.CheckInTime.TimeOfDay;
                    var checkOutTime = overtimeCheckOut.CheckOutTime.TimeOfDay;

                    var effectiveStart = checkInTime < overtimeStart ? overtimeStart : checkInTime;
                    var effectiveEnd = checkOutTime > overtimeEnd ? overtimeEnd : checkOutTime;

                    if (effectiveEnd > effectiveStart)
                    {
                        var overtimeDuration = effectiveEnd - effectiveStart;
                        totalOvertimeHours += (decimal)overtimeDuration.TotalHours;
                    }
                }
            }

            decimal overtimeRate = salaryRecord.Employee.OvertimeRate ?? 50000;

            if (!hasReceivedSalary && request.FixedSalary.HasValue)
            {
                if (request.FixedSalary < 0)
                    return BadRequest("FixedSalary không thể là số âm.");
                salaryRecord.FixedSalary = (int)request.FixedSalary.Value;
            }

            decimal salaryPerShift = totalShiftsInMonth > 0 ? (salaryRecord.FixedSalary ?? 0) / totalShiftsInMonth : 0;
            decimal baseSalary = salaryPerShift * totalWorkDays;
            decimal overtimePay = totalOvertimeHours * overtimeRate;
            decimal finalSalary = baseSalary + (salaryRecord.BonusSalary ?? 0) - (salaryRecord.Penalty ?? 0) + overtimePay;

            salaryRecord.WorkingDays = totalWorkDays;
            salaryRecord.BonusHours = (int)totalOvertimeHours;
            salaryRecord.SalaryPerShift = (int)salaryPerShift;
            salaryRecord.FinalSalary = (int)finalSalary;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                salaryRecord.EmployeeId,
                EmployeeName = salaryRecord.Employee?.FullName ?? "Không xác định",
                Month = month,
                Year = year,
                FixedSalary = salaryRecord.FixedSalary,
                SalaryPerShift = (int)salaryPerShift,
                TotalWorkDays = totalWorkDays,
                TotalOvertimeHours = totalOvertimeHours,
                OvertimeRate = overtimeRate,
                OvertimePay = (int)overtimePay,
                BonusSalary = salaryRecord.BonusSalary ?? 0,
                Penalty = salaryRecord.Penalty ?? 0,
                TotalSalary = salaryRecord.FinalSalary
            });
        }

        [HttpPost("request-overtime")]
        public async Task<IActionResult> RequestOvertime([FromBody] OvertimeRequestDTO request)
        {
            if (request.EmployeeId <= 0 || request.Date == null || request.TotalHours <= 0)
                return BadRequest("Dữ liệu yêu cầu không hợp lệ.");

            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date,
                TotalHours = request.TotalHours,
                Reason = request.Reason,
                IsApproved = false
            };

            _context.OvertimeRecords.Add(overtimeRecord);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Yêu cầu làm thêm giờ đã được gửi, chờ admin phê duyệt." });
        }

        [HttpPut("reject-overtime/{id}")]
        public async Task<IActionResult> RejectOvertime(int id)
        {
            var overtimeRecord = await _context.OvertimeRecords.FindAsync(id);
            if (overtimeRecord == null)
                return NotFound(new { Message = "Không tìm thấy yêu cầu tăng ca." });

            if (overtimeRecord.IsApproved)
                return BadRequest(new { Message = "Yêu cầu tăng ca này đã được duyệt, không thể từ chối." });

            if (overtimeRecord.IsRejected)
                return BadRequest(new { Message = "Yêu cầu tăng ca này đã bị từ chối trước đó." });

            overtimeRecord.IsApproved = false;
            overtimeRecord.IsRejected = true;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Yêu cầu tăng ca đã bị từ chối." });
        }

        [HttpPut("approve-overtime/{id}")]
        public async Task<IActionResult> ApproveOvertime(int id)
        {
            var overtimeRecord = await _context.OvertimeRecords.FindAsync(id);
            if (overtimeRecord == null)
                return NotFound(new { Message = "Không tìm thấy yêu cầu tăng ca." });

            if (overtimeRecord.IsApproved)
                return BadRequest(new { Message = "Yêu cầu tăng ca này đã được duyệt trước đó." });

            if (overtimeRecord.IsRejected)
                return BadRequest(new { Message = "Yêu cầu tăng ca này đã bị từ chối trước đó." });

            overtimeRecord.IsApproved = true;
            overtimeRecord.IsRejected = false;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Yêu cầu tăng ca đã được duyệt thành công." });
        }

        [HttpPost("pay-salary")]
        public async Task<IActionResult> PaySalary([FromBody] SalaryPaymentDTO request)
        {
            if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount < 0)
                return BadRequest(new { Message = "Dữ liệu yêu cầu không hợp lệ." });

            var salaryRecord = await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                         s.StartDate.HasValue &&
                                         s.StartDate.Value.Month == request.Month &&
                                         s.StartDate.Value.Year == request.Year);

            if (salaryRecord == null)
                return NotFound(new { Message = "Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho." });

            if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
                return BadRequest(new { Message = "Lương cuối cùng chưa được tính hoặc bằng 0, không thể thanh toán." });

            decimal totalPaid = await _context.SalaryPaymentHistories
                .Where(p => p.EmployeeId == request.EmployeeId &&
                           p.PaymentDate.HasValue &&
                           p.PaymentDate.Value.Month == request.Month &&
                           p.PaymentDate.Value.Year == request.Year &&
                           p.IsDeleted == false)
                .SumAsync(p => p.PaidAmount);

            decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

            if (remainingAmount <= 0)
                return BadRequest(new { Message = "Lương của nhân viên đã được thanh toán đầy đủ." });

            if (request.PaidAmount > remainingAmount)
                return BadRequest(new { Message = $"Số tiền thanh toán ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount})." });

            // Thêm bản ghi thanh toán mới
            var paymentHistory = new SalaryPaymentHistory
            {
                EmployeeId = request.EmployeeId,
                SalaryId = salaryRecord.SalaryId,
                PaymentDate = DateTime.Now,
                PaidAmount = request.PaidAmount,
                Note = request.Note ?? $"Thanh toán lương tháng {request.Month}/{request.Year}",
                IsDeleted = false
            };

            _context.SalaryPaymentHistories.Add(paymentHistory);

            // Cập nhật trạng thái thanh toán
            decimal newTotalPaid = totalPaid + request.PaidAmount;
            decimal newRemainingAmount = (salaryRecord.FinalSalary ?? 0) - newTotalPaid;
            string paymentStatus = newRemainingAmount <= 0 ? "Đã thanh toán" : "Chưa thanh toán";

            // Nếu cần lưu PaymentStatus vào cơ sở dữ liệu, thêm cột vào Salary và cập nhật
            // Ví dụ: salaryRecord.PaymentStatus = paymentStatus;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                EmployeeId = salaryRecord.EmployeeId,
                EmployeeName = salaryRecord.Employee?.FullName ?? "Không xác định",
                Month = request.Month,
                Year = request.Year,
                TotalSalary = salaryRecord.FinalSalary,
                PaidAmount = request.PaidAmount,
                RemainingAmount = newRemainingAmount,
                PaymentDate = paymentHistory.PaymentDate,
                Note = paymentHistory.Note,
                PaymentStatus = paymentStatus // Thêm trạng thái thanh toán vào phản hồi
            });
        }
        [HttpGet("list-pending-overtime")]
        public async Task<IActionResult> ListPendingOvertimeRequests(
            [FromQuery] int? month = null,
            [FromQuery] int? year = null,
            [FromQuery] string? search = null)
        {
            var query = _context.OvertimeRecords
                .Where(o => o.IsApproved == false && o.IsRejected == false)
                .Join(_context.Employees,
                    o => o.EmployeeId,
                    e => e.EmployeeId,
                    (o, e) => new
                    {
                        OvertimeId = o.Id,
                        EmployeeId = o.EmployeeId,
                        EmployeeName = e.FullName,
                        Phone = e.Phone,
                        Date = o.Date,
                        TotalHours = o.TotalHours,
                        Reason = o.Reason,
                        IdentityNumber = e.IdentityNumber,
                        Hometown = e.Hometown
                    });

            if (month.HasValue && year.HasValue)
                query = query.Where(o => o.Date.Month == month.Value && o.Date.Year == year.Value);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(o => o.EmployeeName.Contains(search) || o.Phone.Contains(search));

            var pendingOvertimeList = await query
                .OrderBy(o => o.Date)
                .ToListAsync();

            if (!pendingOvertimeList.Any())
                return Ok(new { Message = "Không có yêu cầu tăng ca nào đang chờ duyệt.", Data = new List<object>() });

            return Ok(new
            {
                Message = "Danh sách yêu cầu tăng ca đang chờ duyệt.",
                Data = pendingOvertimeList
            });
        }

        [HttpPost("advance-salary")]
        public async Task<IActionResult> AdvanceSalary([FromBody] SalaryPaymentDTO request)
        {
            if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount <= 0)
                return BadRequest(new { Message = "Dữ liệu yêu cầu ứng lương không hợp lệ." });

            var salaryRecord = await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                         s.StartDate.HasValue &&
                                         s.StartDate.Value.Month == request.Month &&
                                         s.StartDate.Value.Year == request.Year);

            if (salaryRecord == null)
                return NotFound(new { Message = "Chưa có bảng lương cho nhân viên trong tháng yêu cầu." });

            if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
                return BadRequest(new { Message = "Lương chưa được tính, không thể ứng lương." });

            decimal totalPaid = await _context.SalaryPaymentHistories
                .Where(p => p.EmployeeId == request.EmployeeId &&
                           p.PaymentDate.HasValue &&
                           p.PaymentDate.Value.Month == request.Month &&
                           p.PaymentDate.Value.Year == request.Year &&
                           p.IsDeleted == false)
                .SumAsync(p => p.PaidAmount);

            decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

            if (remainingAmount <= 0)
                return BadRequest(new { Message = "Lương đã được thanh toán hoặc ứng đầy đủ." });

            if (request.PaidAmount > remainingAmount)
                return BadRequest(new { Message = $"Số tiền ứng ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount})." });

            var advancePayment = new SalaryPaymentHistory
            {
                EmployeeId = request.EmployeeId,
                SalaryId = salaryRecord.SalaryId,
                PaymentDate = DateTime.Now,
                PaidAmount = request.PaidAmount,
                PaymentMethod = 0, // 0: ứng lương
                Note = request.Note ?? $"Ứng lương tháng {request.Month}/{request.Year}",
                IsDeleted = false
            };

            _context.SalaryPaymentHistories.Add(advancePayment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                EmployeeId = salaryRecord.EmployeeId,
                EmployeeName = salaryRecord.Employee?.FullName ?? "Không xác định",
                Month = request.Month,
                Year = request.Year,
                TotalSalary = salaryRecord.FinalSalary,
                AdvancedAmount = request.PaidAmount,
                RemainingAmount = remainingAmount - request.PaidAmount,
                PaymentDate = advancePayment.PaymentDate,
                Note = advancePayment.Note
            });
        }

        #region DTOs
        public class ShiftSettingDTO
        {
            public int Month { get; set; }
            public int Year { get; set; }
            public int TotalShifts { get; set; }
        }

        public class OvertimeRequestDTO
        {
            public int EmployeeId { get; set; }
            public DateTime Date { get; set; }
            public decimal TotalHours { get; set; }
            public string Reason { get; set; }
        }

        public class SalaryPaymentDTO
        {
            public int EmployeeId { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
            public int PaidAmount { get; set; }
            public string? Note { get; set; }
        }

        public class ShiftDetail
        {
            public DateTime Date { get; set; }
            public string Shift { get; set; }
            public DateTime CheckIn { get; set; }
            public DateTime CheckOut { get; set; }
        }

        public class AddSalaryRequestDTO
        {
            public int StaffId { get; set; }
            public int FixedSalary { get; set; }
            public int BonusSalary { get; set; }
            public int PenaltyAmount { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
        }

        public class SetSalaryRequestDTO
        {
            public int EmployeeId { get; set; }
            public decimal? FixedSalary { get; set; }
        }

        public class SetOvertimeRateRequestDTO
        {
            public int EmployeeId { get; set; }
            public decimal OvertimeRate { get; set; }
        }
        #endregion
    }
}