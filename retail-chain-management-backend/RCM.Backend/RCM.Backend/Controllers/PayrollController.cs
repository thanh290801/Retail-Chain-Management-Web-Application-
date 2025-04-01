using ClosedXML.Excel;
using DocumentFormat.OpenXml.Office2016.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTO;
using RCM.Backend.DTOs;
using RCM.Backend.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

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

// DTO cho yêu cầu thanh toán lương
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

[Route("api/[controller]")]
[ApiController]
public class PayrollController : ControllerBase
{
    private readonly RetailChainContext _context;

    public PayrollController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpPost("setup-shifts")]
    public async Task<IActionResult> SetupShifts([FromBody] ShiftSettingDTO request)
    {
        if (request.TotalShifts <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000)
        {
            return BadRequest("Dữ liệu không hợp lệ.");
        }

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
    public async Task<IActionResult> CalculateAndSavePayrollForAllEmployees(
     [FromQuery] string? staffId,
     [FromQuery] string? search,
     [FromQuery] int month,
     [FromQuery] int year,
     [FromQuery] bool forceRecalculate = false)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);
        decimal overtimeRate = 50000; // Đồng bộ với GetPayrollDetails

        // Kiểm tra xem lương đã được tính chưa
        bool payrollCalculated = await _context.Salaries
            .AnyAsync(s => s.StartDate.HasValue &&
                           s.StartDate.Value.Month == month &&
                           s.StartDate.Value.Year == year &&
                           s.IsCalculated == true);

        // Lấy số ca làm việc mặc định trong tháng
        var shiftSetting = await _context.ShiftSettings
            .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
        int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

        // Lọc danh sách nhân viên
        var employeesQuery = _context.Employees.AsNoTracking();
        if (!string.IsNullOrEmpty(search))
        {
            employeesQuery = employeesQuery.Where(e => e.FullName.Contains(search) || e.Phone.Contains(search));
        }
        if (!string.IsNullOrEmpty(staffId))
        {
            employeesQuery = employeesQuery.Where(e => e.EmployeeId.ToString() == staffId);
        }
        var employees = await employeesQuery.ToListAsync();
        var employeeIds = employees.Select(e => e.EmployeeId).ToList();

        // Khai báo danh sách trả về và biến existingSalaries một lần
        var salaryRecords = new List<object>();
        List<Salary> existingSalaries = null;

        // Tính toán hoặc cập nhật lương nếu cần
        if (!payrollCalculated || forceRecalculate)
        {
            if (forceRecalculate)
            {
                existingSalaries = await _context.Salaries
                    .Where(s => s.StartDate.HasValue &&
                                s.StartDate.Value.Month == month &&
                                s.StartDate.Value.Year == year)
                    .ToListAsync();
                _context.Salaries.RemoveRange(existingSalaries);
                await _context.SaveChangesAsync();
            }

            // Lấy dữ liệu chấm công
            var attendanceData = await _context.AttendanceCheckIns
                .Where(ci => employeeIds.Contains(ci.EmployeeId) &&
                             ci.AttendanceDate.Month == month &&
                             ci.AttendanceDate.Year == year)
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new
                    {
                        ci.EmployeeId,
                        ci.AttendanceDate,
                        ci.Shift,
                        ci.CheckInTime,
                        co.CheckOutTime
                    })
                .ToListAsync();

            var workDaysDict = attendanceData
                .GroupBy(x => new { x.EmployeeId, x.AttendanceDate })
                .Select(g => new { g.Key.EmployeeId, g.Key.AttendanceDate })
                .GroupBy(x => x.EmployeeId)
                .ToDictionary(g => g.Key, g => g.Count());

            var shiftDetailsDict = attendanceData
                .GroupBy(x => x.EmployeeId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => new ShiftDetail
                    {
                        Date = x.AttendanceDate,
                        Shift = x.Shift,
                        CheckIn = x.CheckInTime,
                        CheckOut = x.CheckOutTime
                    }).ToList()
                );

            // Tính lương cho từng nhân viên
            foreach (var employee in employees)
            {
                int totalWorkDays = workDaysDict.ContainsKey(employee.EmployeeId) ? workDaysDict[employee.EmployeeId] : 0;

                // Tính totalOvertimeHours giống GetPayrollDetails
                decimal totalOvertimeHours = await _context.OvertimeRecords
                    .Where(o => o.EmployeeId == employee.EmployeeId &&
                                o.Date.Month == month &&
                                o.Date.Year == year &&
                                o.IsApproved == true)
                    .SumAsync(o => o.TotalHours);

                decimal overtimePay = totalOvertimeHours * overtimeRate;
                decimal salaryPerShift = (employee.FixedSalary ?? 0) / totalShiftsInMonth;
                decimal baseSalary = salaryPerShift * totalWorkDays;

                var salaryRecord = new Salary
                {
                    EmployeeId = employee.EmployeeId,
                    FixedSalary = employee.FixedSalary,
                    StartDate = startDate,
                    EndDate = endDate,
                    BonusSalary = (int)overtimePay,
                    FinalSalary = (int)(baseSalary + overtimePay),
                    WorkingDays = totalWorkDays,
                    BonusHours = (int)totalOvertimeHours,
                    SalaryPerShift = (int)salaryPerShift,
                    UpdateAt = DateTime.Now,
                    IsCalculated = true
                };
                _context.Salaries.Add(salaryRecord);
            }
            await _context.SaveChangesAsync();
        }

        // Gán giá trị cho existingSalaries nếu chưa có
        existingSalaries ??= await _context.Salaries
            .Where(s => employeeIds.Contains(s.EmployeeId) &&
                        s.StartDate.HasValue &&
                        s.StartDate.Value.Month == month &&
                        s.StartDate.Value.Year == year)
            .ToListAsync();

        foreach (var employee in employees)
        {
            var salaryRecord = existingSalaries.FirstOrDefault(s => s.EmployeeId == employee.EmployeeId);
            if (salaryRecord == null) continue;

            // Kiểm tra trạng thái thanh toán
            bool hasReceivedSalary = await _context.SalaryPaymentHistories
                .AnyAsync(p => p.EmployeeId == employee.EmployeeId &&
                               p.PaymentDate.HasValue &&
                               p.PaymentDate.Value.Month == month &&
                               p.PaymentDate.Value.Year == year);

            // Lấy chi tiết ca làm việc
            var attendanceData = await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == employee.EmployeeId &&
                             ci.AttendanceDate.Month == month &&
                             ci.AttendanceDate.Year == year)
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new ShiftDetail
                    {
                        Date = ci.AttendanceDate,
                        Shift = ci.Shift,
                        CheckIn = ci.CheckInTime,
                        CheckOut = co.CheckOutTime
                    })
                .ToListAsync();

            // Tính totalOvertimeHours giống GetPayrollDetails
            decimal totalOvertimeHours = await _context.OvertimeRecords
                .Where(o => o.EmployeeId == employee.EmployeeId &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .SumAsync(o => o.TotalHours);

            decimal overtimePay = totalOvertimeHours * overtimeRate;
            decimal salaryPerShift = (employee.FixedSalary ?? 0) / totalShiftsInMonth;
            if (forceRecalculate && salaryRecord.BonusHours != (int)totalOvertimeHours)
            {
                salaryRecord.BonusHours = (int)totalOvertimeHours;
                salaryRecord.BonusSalary = (int)overtimePay;
                salaryRecord.FinalSalary = (int)(salaryPerShift * (salaryRecord.WorkingDays ?? 0) + overtimePay);
                salaryRecord.UpdateAt = DateTime.Now;
                _context.Salaries.Update(salaryRecord);
                _context.SaveChanges();
            }
            salaryRecords.Add(new
            {
                SalaryRecord = salaryRecord,

                EmployeeName = employee.FullName,
                Phone = employee.Phone,
                FixedSalary = employee.FixedSalary ?? 0,
                SalaryPerShift = salaryRecord.SalaryPerShift ?? (int)salaryPerShift,
                TotalWorkDays = salaryRecord.WorkingDays ?? 0,
                TotalShiftInMonth = totalShiftsInMonth,
                FinalSalary = salaryRecord.FinalSalary ?? 0,
                Shifts = attendanceData,
                TotalOvertimeHours = (int)totalOvertimeHours,
                OvertimePay = salaryRecord.BonusSalary ?? (int)overtimePay,
                TotalSalary = salaryRecord.FinalSalary ?? 0,
                IdentityNumber = employee.IdentityNumber,
                Hometown = employee.Hometown,
                PaymentStatus = hasReceivedSalary ? "Đã thanh toán" : "Chưa thanh toán"
            });
        }

        return Ok(salaryRecords);
    }
    [HttpPost("getSalaryList")]
    public async Task<IActionResult> GetSalaryList(
        [FromQuery] string? search,
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        var salaryList = _context.Salaries;

        if (month != null && year != null)
            salaryList.Where(a => a.StartDate.Value.Month == month
            && a.StartDate.Value.Year == year
            && a.EndDate.Value.Month == month
            && a.EndDate.Value.Year == year);

        return Ok(salaryList.ToList());
    }

    [HttpPost("add-to-salary-record")]
    public async Task<IActionResult> AddToSalaryRecord(
   [FromBody] AddSalaryRequestDTO addSalaryRequestDTO)
    {
        var fixedSalary = addSalaryRequestDTO.FixedSalary;
        int month = addSalaryRequestDTO.Month;
        int year = addSalaryRequestDTO.Year;
        int staffId = addSalaryRequestDTO.StaffId;

        bool hasReceivedSalary = await _context.SalaryPaymentHistories
    .AnyAsync(p => p.EmployeeId == addSalaryRequestDTO.StaffId &&
                   p.PaymentDate.HasValue &&
                   p.PaymentDate.Value.Month == month &&
                   p.PaymentDate.Value.Year == year);

        // Check if salary has been paid and FixedSalary is being modified
        if (hasReceivedSalary)
        {
            return BadRequest(new { Message = "Không thể tính lại lương vì lương đã được thanh toán." });
        }

        var shiftSetting = await _context.ShiftSettings
            .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
        int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

        var attendanceData = await _context.AttendanceCheckIns
    .Where(ci => ci.EmployeeId == staffId &&
                ci.AttendanceDate.Month == month &&
                ci.AttendanceDate.Year == year)
    .Join(_context.AttendanceCheckOuts,
        ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
        co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
        (ci, co) => new
        {
            ci.EmployeeId,
            ci.AttendanceDate,
            ci.Shift,
            ci.CheckInTime,
            co.CheckOutTime
        })
    .ToListAsync();

        var workDaysDict = attendanceData
            .GroupBy(x => new { x.EmployeeId, x.AttendanceDate })
            .Select(g => new { g.Key.EmployeeId, g.Key.AttendanceDate })
            .GroupBy(x => x.EmployeeId)
            .ToDictionary(
                g => g.Key,
                g => g.Count()
            );

        var shiftDetailsDict = attendanceData
            .GroupBy(x => x.EmployeeId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(x => new ShiftDetail
                {
                    Date = x.AttendanceDate,
                    Shift = x.Shift,
                    CheckIn = x.CheckInTime,
                    CheckOut = x.CheckOutTime
                }).ToList()
            );

        var overtimeRecords = await _context.OvertimeRecords
            .Where(o => o.EmployeeId == staffId &&
                        o.Date.Month == month &&
                        o.Date.Year == year &&
                        o.IsApproved == true)
            .ToListAsync();

        int totalWorkDays = workDaysDict.ContainsKey(staffId) ? workDaysDict[staffId] : 0;
        decimal totalOvertimeHours = overtimeRecords.Any() ? overtimeRecords.Sum(o => o.TotalHours) : 0;
        // Thiết lập lương
        decimal overtimeRate = 50000;
        decimal overtimePay = totalOvertimeHours * overtimeRate;
        decimal salaryPerShift = fixedSalary / totalShiftsInMonth;
        decimal baseSalary = salaryPerShift * totalWorkDays;

        if (attendanceData == null || attendanceData.Count <= 0)
        {
            return BadRequest(new { Message = "Số ngày làm việc không đủ để tính lương" });
        }

        var payrollExists = await _context.Salaries
            .FirstOrDefaultAsync(s => s.StartDate.HasValue &&
                           s.StartDate.Value.Month == month &&
                           s.StartDate.Value.Year == year);
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);
        if (payrollExists != null)
        {
            payrollExists.UpdateAt = DateTime.Now;
            payrollExists.EmployeeId = staffId;
            payrollExists.WorkingDays = totalWorkDays;
            payrollExists.FixedSalary = fixedSalary;
            payrollExists.StartDate = attendanceData.FirstOrDefault() == null ? startDate : attendanceData.FirstOrDefault()?.AttendanceDate;
            payrollExists.EndDate = attendanceData.LastOrDefault() == null ? endDate : attendanceData.FirstOrDefault()?.AttendanceDate;
            payrollExists.SalaryPerShift = (int)salaryPerShift;
            payrollExists.BonusSalary = addSalaryRequestDTO.BonusSalary;
            payrollExists.Penalty = addSalaryRequestDTO.PenaltyAmount;
            payrollExists.BonusHours = (int)totalOvertimeHours;
            payrollExists.FinalSalary = (int)(salaryPerShift * totalWorkDays + addSalaryRequestDTO.BonusSalary - addSalaryRequestDTO.PenaltyAmount + totalOvertimeHours * overtimeRate);
        }
        else
        {
            var salaryRecords = new Salary
            {
                UpdateAt = DateTime.Now,
                EmployeeId = staffId,
                WorkingDays = totalWorkDays,
                FixedSalary = fixedSalary,
                StartDate = attendanceData.FirstOrDefault() == null ? startDate : attendanceData.FirstOrDefault()?.AttendanceDate,
                EndDate = attendanceData.LastOrDefault() == null ? endDate : attendanceData.FirstOrDefault()?.AttendanceDate,
                SalaryPerShift = (int)salaryPerShift,
                BonusSalary = addSalaryRequestDTO.BonusSalary,
                Penalty = addSalaryRequestDTO.PenaltyAmount,
                BonusHours = (int)totalOvertimeHours,
                FinalSalary = (int)(salaryPerShift * totalWorkDays + addSalaryRequestDTO.BonusSalary - addSalaryRequestDTO.PenaltyAmount + totalOvertimeHours * overtimeRate)
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
                       s.StartDate <= endDate &&
                       (s.EndDate == null || s.EndDate >= startDate))
            .OrderByDescending(s => s.StartDate)
            .Select(s => new
            {
                s.SalaryId,
                s.EmployeeId,
                s.FixedSalary,
                s.BonusSalary,
                s.FinalSalary,
                s.StartDate,
                Employee = new
                {
                    s.Employee.EmployeeId,
                    s.Employee.FullName,
                    s.Employee.Phone,
                    s.Employee.BirthDate,
                    s.Employee.BranchId,
                    s.Employee.FixedSalary,
                    s.Employee.Gender,
                    s.Employee.Hometown,
                    s.Employee.IdentityNumber,
                    s.Employee.ProfileImage,
                    s.Employee.StartDate,
                }
            })
            .FirstOrDefaultAsync();

        var attendanceData = await _context.AttendanceCheckIns
            .Where(ci => ci.EmployeeId == employeeId &&
                        ci.AttendanceDate.Month == month &&
                        ci.AttendanceDate.Year == year)
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

        decimal totalOvertimeHours = await _context.OvertimeRecords
            .Where(o => o.EmployeeId == employeeId &&
                        o.Date.Month == month &&
                        o.Date.Year == year &&
                        o.IsApproved == true)
            .SumAsync(o => o.TotalHours);

        decimal overtimeRate = 50000;
        decimal overtimePay = totalOvertimeHours * overtimeRate;
        decimal salaryPerShift = (salaryRecord?.FixedSalary ?? 0) / totalShiftsInMonth;
        decimal baseSalary = salaryPerShift * totalWorkDays;

        if (salaryRecord == null)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);

            if (employee == null)
            {
                return NotFound("Không tìm thấy nhân viên.");
            }

            return Ok(new
            {
                EmployeeId = employeeId,
                EmployeeName = employee.FullName,
                Phone = employee.Phone,
                FixedSalary = employee.FixedSalary ?? 0,
                SalaryPerShift = (int)(employee.FixedSalary / totalShiftsInMonth),
                TotalWorkDays = totalWorkDays,
                Shifts = shiftDetails,
                TotalOvertimeHours = totalOvertimeHours,
                OvertimePay = (int)overtimePay,
                TotalSalary = (int)(baseSalary + overtimePay),
                IdentityNumber = employee.IdentityNumber,
                Hometown = employee.Hometown,
                PaymentHistory = new List<object>()
            });
        }

        var paymentHistory = await _context.SalaryPaymentHistories
            .Where(p => p.EmployeeId == employeeId &&
                       p.PaymentDate.HasValue &&
                       p.PaymentDate.Value.Month == month &&
                       p.PaymentDate.Value.Year == year)
            .Select(p => new
            {
                p.PaymentDate,
                p.PaidAmount,
                p.Note
            })
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var result = new
        {
            EmployeeId = salaryRecord.EmployeeId,
            EmployeeName = salaryRecord.Employee.FullName,
            Phone = salaryRecord.Employee.Phone,
            FixedSalary = salaryRecord.FixedSalary ?? 0,
            SalaryPerShift = (int)salaryPerShift,
            TotalWorkDays = totalWorkDays,
            Shifts = shiftDetails,
            TotalOvertimeHours = totalOvertimeHours,
            OvertimePay = (int)overtimePay,
            TotalSalary = salaryRecord.FinalSalary ?? (int)(baseSalary + overtimePay),
            IdentityNumber = salaryRecord.Employee.IdentityNumber,
            Hometown = salaryRecord.Employee.Hometown,
            PaymentHistory = paymentHistory
        };

        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportPayroll([FromQuery] int month, [FromQuery] int year)
    {
        var shiftSetting = await _context.ShiftSettings
            .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
        int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

        var payrollList = await _context.Salaries
            .Include(s => s.Employee)
            .Where(s => s.StartDate.HasValue &&
                       s.StartDate.Value.Month == month &&
                       s.StartDate.Value.Year == year)
            .AsNoTracking()
            .Select(s => new
            {
                s.EmployeeId,
                s.Employee.FullName,
                FixedSalary = s.FixedSalary ?? 0,
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
                TotalOvertimeHours = _context.OvertimeRecords
                    .Where(o => o.EmployeeId == s.EmployeeId &&
                                o.Date.Month == month &&
                                o.Date.Year == year &&
                                o.IsApproved == true)
                    .Sum(o => o.TotalHours),
                TotalSalary = s.FinalSalary ?? 0,
                PaidAmount = _context.SalaryPaymentHistories
                    .Where(p => p.EmployeeId == s.EmployeeId &&
                               p.PaymentDate.HasValue &&
                               p.PaymentDate.Value.Month == month &&
                               p.PaymentDate.Value.Year == year)
                    .Sum(p => p.PaidAmount)
            })
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Payroll");
        var headers = new string[]
        {
            "Employee ID", "Full Name", "Fixed Salary", "Salary Per Shift", "Total Work Days",
            "Overtime Hours", "Overtime Pay", "Total Salary", "Paid Amount"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            worksheet.Cell(1, i + 1).Value = headers[i];
        }

        int row = 2;
        decimal overtimeRate = 50000;
        foreach (var p in payrollList)
        {
            decimal salaryPerShift = p.FixedSalary / totalShiftsInMonth;
            decimal baseSalary = salaryPerShift * p.TotalWorkDays;
            decimal overtimePay = p.TotalOvertimeHours * overtimeRate;
            worksheet.Cell(row, 1).Value = p.EmployeeId;
            worksheet.Cell(row, 2).Value = p.FullName;
            worksheet.Cell(row, 3).Value = p.FixedSalary;
            worksheet.Cell(row, 4).Value = salaryPerShift;
            worksheet.Cell(row, 5).Value = p.TotalWorkDays;
            worksheet.Cell(row, 6).Value = p.TotalOvertimeHours;
            worksheet.Cell(row, 7).Value = overtimePay;
            worksheet.Cell(row, 8).Value = p.TotalSalary;
            worksheet.Cell(row, 9).Value = p.PaidAmount;
            row++;
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var content = stream.ToArray();
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Payroll_{month}_{year}.xlsx");
    }

    [HttpPut("update-salary")]
    public async Task<IActionResult> UpdateSalaryByEmployeeIdAndMonth([FromBody] SalaryDTO request)
    {
        if (request == null || request.EmployeeId <= 0 || request.StartDate == null)
        {
            return BadRequest("Dữ liệu yêu cầu không hợp lệ.");
        }

        int month = request.StartDate.Value.Month;
        int year = request.StartDate.Value.Year;

        var shiftSetting = await _context.ShiftSettings
            .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
        int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

        var salaryRecord = await _context.Salaries
            .Include(s => s.Employee)
            .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                     s.StartDate.HasValue &&
                                     s.StartDate.Value.Month == month &&
                                     s.StartDate.Value.Year == year);

        if (salaryRecord == null)
        {
            return NotFound("Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho.");
        }

        bool hasReceivedSalary = await _context.SalaryPaymentHistories
            .AnyAsync(p => p.EmployeeId == request.EmployeeId &&
                           p.PaymentDate.HasValue &&
                           p.PaymentDate.Value.Month == month &&
                           p.PaymentDate.Value.Year == year);

        // Check if salary has been paid and FixedSalary is being modified
        if (hasReceivedSalary && request.FixedSalary.HasValue)
        {
            return BadRequest("Không thể cập nhật FixedSalary vì lương đã được thanh toán.");
        }

        int totalWorkDays = await _context.AttendanceCheckIns
            .Where(ci => ci.EmployeeId == request.EmployeeId &&
                         ci.AttendanceDate.Month == month &&
                         ci.AttendanceDate.Year == year)
            .Join(_context.AttendanceCheckOuts,
                ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                (ci, co) => new { ci.AttendanceDate })
            .Distinct()
            .CountAsync();

        decimal totalOvertimeHours = await _context.OvertimeRecords
            .Where(o => o.EmployeeId == request.EmployeeId &&
                        o.Date.Month == month &&
                        o.Date.Year == year &&
                        o.IsApproved == true)
            .SumAsync(o => o.TotalHours);

        decimal overtimeRate = 50000;
        decimal overtimePay = totalOvertimeHours * overtimeRate;

        // Update FixedSalary only if it hasn't been paid and a new value is provided
        if (!hasReceivedSalary && request.FixedSalary.HasValue)
        {
            if (request.FixedSalary < 0)
            {
                return BadRequest("FixedSalary không thể là số âm.");
            }
            salaryRecord.FixedSalary = request.FixedSalary.Value;
        }
        else if (salaryRecord.FixedSalary == null)
        {
            salaryRecord.FixedSalary = salaryRecord.Employee?.FixedSalary ?? 0;
        }

        decimal salaryPerShift = (salaryRecord.FixedSalary ?? 0) / totalShiftsInMonth;
        decimal baseSalary = salaryPerShift * totalWorkDays;

        salaryRecord.BonusSalary = (int)overtimePay;
        salaryRecord.FinalSalary = (int)(baseSalary + overtimePay);

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
            OvertimePay = (int)overtimePay,
            TotalSalary = salaryRecord.FinalSalary
        });
    }
    [HttpPost("request-overtime")]
    public async Task<IActionResult> RequestOvertime([FromBody] OvertimeRequestDTO request)
    {
        if (request.EmployeeId <= 0 || request.Date == null || request.TotalHours <= 0)
        {
            return BadRequest("Dữ liệu yêu cầu không hợp lệ.");
        }

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

    [HttpPut("approve-overtime/{id}")]
    public async Task<IActionResult> ApproveOvertime(int id)
    {
        var overtimeRecord = await _context.OvertimeRecords.FindAsync(id);
        if (overtimeRecord == null)
        {
            return NotFound("Không tìm thấy yêu cầu làm thêm giờ.");
        }

        if (overtimeRecord.IsApproved)
        {
            return BadRequest("Yêu cầu này đã được phê duyệt trước đó.");
        }

        overtimeRecord.IsApproved = true;
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Yêu cầu làm thêm giờ đã được phê duyệt." });
    }
    [HttpPut("reject-overtime/{id}")]
    public async Task<IActionResult> RejectOvertime(int id)
    {
        var overtimeRecord = await _context.OvertimeRecords.FindAsync(id);
        if (overtimeRecord == null)
        {
            return NotFound("Không tìm thấy yêu cầu làm thêm giờ.");
        }

        // Nếu yêu cầu đã được phê duyệt thì không thể từ chối
        if (overtimeRecord.IsApproved)
        {
            return BadRequest("Yêu cầu này đã được phê duyệt trước đó.");
        }

        // Đánh dấu yêu cầu là không được phê duyệt (từ chối)
        overtimeRecord.IsApproved = false;

        // Lưu thay đổi vào cơ sở dữ liệu
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Yêu cầu làm thêm giờ đã bị từ chối." });
    }


    // API mới: Thanh toán lương
    [HttpPost("pay-salary")]
    public async Task<IActionResult> PaySalary([FromBody] SalaryPaymentDTO request)
    {
        if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount < 0)
        {
            return BadRequest(new { Message = "Dữ liệu yêu cầu không hợp lệ." });
        }

        var salaryRecord = await _context.Salaries
            .Include(s => s.Employee)
            .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                     s.StartDate.HasValue &&
                                     s.StartDate.Value.Month == request.Month &&
                                     s.StartDate.Value.Year == request.Year);

        if (salaryRecord == null)
        {
            return NotFound(new { Message = "Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho." });
        }

        if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
        {
            return BadRequest(new { Message = "Lương cuối cùng chưa được tính hoặc bằng 0, không thể thanh toán." });
        }

        // Tính tổng số tiền đã thanh toán trước đó
        decimal totalPaid = await _context.SalaryPaymentHistories
            .Where(p => p.EmployeeId == request.EmployeeId &&
                       p.PaymentDate.HasValue &&
                       p.PaymentDate.Value.Month == request.Month &&
                       p.PaymentDate.Value.Year == request.Year &&
                       p.IsDeleted == false)
            .SumAsync(p => p.PaidAmount);

        decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

        if (remainingAmount <= 0)
        {
            return BadRequest(new { Message = "Lương của nhân viên đã được thanh toán đầy đủ." });
        }

        if (request.PaidAmount > remainingAmount)
        {
            return BadRequest(new { Message = $"Số tiền thanh toán ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount})." });
        }

        // Thêm bản ghi thanh toán vào lịch sử
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
        await _context.SaveChangesAsync();

        return Ok(new
        {
            EmployeeId = salaryRecord.EmployeeId,
            EmployeeName = salaryRecord.Employee?.FullName ?? "Không xác định",
            Month = request.Month,
            Year = request.Year,
            TotalSalary = salaryRecord.FinalSalary,
            PaidAmount = request.PaidAmount,
            RemainingAmount = remainingAmount - request.PaidAmount,
            PaymentDate = paymentHistory.PaymentDate,
            Note = paymentHistory.Note
        });
    }
    [HttpGet("list-pending-overtime")]
    public async Task<IActionResult> ListPendingOvertimeRequests(
    [FromQuery] int? month = null,
    [FromQuery] int? year = null,
    [FromQuery] string? search = null)
    {
        var query = _context.OvertimeRecords
            .Where(o => o.IsApproved == false) // Chỉ lấy các yêu cầu chưa được duyệt
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

        // Lọc theo tháng và năm nếu được cung cấp
        if (month.HasValue && year.HasValue)
        {
            query = query.Where(o => o.Date.Month == month.Value && o.Date.Year == year.Value);
        }

        // Tìm kiếm theo tên nhân viên hoặc số điện thoại nếu có từ khóa tìm kiếm
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(o => o.EmployeeName.Contains(search) || o.Phone.Contains(search));
        }

        var pendingOvertimeList = await query
            .OrderBy(o => o.Date) // Sắp xếp theo ngày tăng ca
            .ToListAsync();

        if (!pendingOvertimeList.Any())
        {
            return Ok(new { Message = "Không có yêu cầu tăng ca nào đang chờ duyệt.", Data = new List<object>() });
        }

        return Ok(new
        {
            Message = "Danh sách yêu cầu tăng ca đang chờ duyệt.",
            Data = pendingOvertimeList.Select(o => new
            {
                o.OvertimeId,
                o.EmployeeId,
                o.EmployeeName,
                o.Phone,
                o.Date,
                o.TotalHours,
                o.Reason,
                o.IdentityNumber,
                o.Hometown
            })
        });
    }
    [HttpPost("advance-salary")]
    public async Task<IActionResult> AdvanceSalary([FromBody] SalaryPaymentDTO request)
    {
        if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount <= 0)
        {
            return BadRequest(new { Message = "Dữ liệu yêu cầu ứng lương không hợp lệ." });
        }

        var salaryRecord = await _context.Salaries
            .Include(s => s.Employee)
            .FirstOrDefaultAsync(s => s.EmployeeId == request.EmployeeId &&
                                     s.StartDate.HasValue &&
                                     s.StartDate.Value.Month == request.Month &&
                                     s.StartDate.Value.Year == request.Year);

        if (salaryRecord == null)
        {
            return NotFound(new { Message = "Chưa có bảng lương cho nhân viên trong tháng yêu cầu." });
        }

        if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
        {
            return BadRequest(new { Message = "Lương chưa được tính, không thể ứng lương." });
        }

        // Calculate total paid and advanced amount
        decimal totalPaid = await _context.SalaryPaymentHistories
            .Where(p => p.EmployeeId == request.EmployeeId &&
                       p.PaymentDate.HasValue &&
                       p.PaymentDate.Value.Month == request.Month &&
                       p.PaymentDate.Value.Year == request.Year &&
                       p.IsDeleted == false)
            .SumAsync(p => p.PaidAmount);

        decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

        if (remainingAmount <= 0)
        {
            return BadRequest(new { Message = "Lương đã được thanh toán hoặc ứng đầy đủ." });
        }

        if (request.PaidAmount > remainingAmount)
        {
            return BadRequest(new { Message = $"Số tiền ứng ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount})." });
        }

        var advancePayment = new SalaryPaymentHistory
        {
            EmployeeId = request.EmployeeId,
            SalaryId = salaryRecord.SalaryId,
            PaymentDate = DateTime.Now,
            PaidAmount = request.PaidAmount,
            PaymentMethod = 0, // 0 could represent advance payment
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