using ClosedXML.Excel;

using DocumentFormat.OpenXml.Math;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using RCM.Backend.DTO;
using RCM.Backend.Models;
using System.Drawing;
using System.Globalization;
using static EmployeeDTO;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly RetailChainContext _context;
        public StaffController(RetailChainContext context)
        {
            _context = context;
        }
        [HttpGet("getStaff")]
        public IActionResult GetAllStaff([FromQuery] string? name)
        {
            var query = _context.Employees
                .Join(_context.Accounts,
                      e => e.AccountId,
                      a => a.AccountId,
                      (e, a) => new { Employee = e, Account = a })
                .Where(ea => ea.Account.Role == "Staff");

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(ea => ea.Employee.FullName.Contains(name));
            }

            var staffList = query
                .Select(ea => new EmployeeDTO
                {
                    Id = ea.Employee.EmployeeId,
                    //Image = ea.Employee.ProfileImage != null ? $"/access/{ea.Employee.ProfileImage}" : null, // Trả về URL
                    FullName = ea.Employee.FullName,
                    Gender = ea.Employee.Gender,
                    BirthDate = ea.Employee.BirthDate,
                    PhoneNumber = ea.Employee.Phone,
                    WorkShiftId = ea.Employee.WorkShiftId,
                    ActiveStatus = ea.Employee.IsActive,
                    StartDate = ea.Employee.StartDate,
                    BranchId = ea.Employee.BranchId,
                    Hometown = ea.Employee.Hometown,
                    IsStaff = true,
                    Username = ea.Account.Username,
                    Role = ea.Account.Role
                })
                .ToList();

            return Ok(staffList);
        }

        [HttpGet("staff/image/{employeeId}")]
        public IActionResult GetStaffImage(int employeeId)
        {
            var employee = _context.Employees.FirstOrDefault(e => e.EmployeeId == employeeId);
            if (employee == null || string.IsNullOrEmpty(employee.ProfileImage))
                return NotFound();

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", employee.ProfileImage.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
                return NotFound();

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            var contentType = "image/jpeg"; // Có thể điều chỉnh dựa trên phần mở rộng file
            return File(fileBytes, contentType);
        }

        [HttpGet("{id}")]
        public IActionResult GetStaffById(int id)
        {
            var employeeData = _context.Employees.Include(a => a.Account).FirstOrDefault(a => a.EmployeeId == id);

            if (employeeData == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên!" });
            }


            EmployeeDTO employeeDTO = new EmployeeDTO
            {
                Id = employeeData.EmployeeId,
                Image = employeeData.ProfileImage,
                FullName = employeeData.FullName,
                Gender = employeeData.Gender,
                BirthDate = employeeData.BirthDate,
                PhoneNumber = employeeData.Phone ?? "",
                WorkShiftId = employeeData.WorkShiftId,
                ActiveStatus = employeeData.IsActive,
                PasswordHash = employeeData.Account.PasswordHash,
                StartDate = employeeData.StartDate,
                BranchId = employeeData.BranchId,
                IsStaff = true,
                OvertimeRate = employeeData.OvertimeRate,
                Username = employeeData.Account != null ? employeeData.Account.Username : "",
                Role = employeeData.Account != null ? employeeData.Account.Role : "",
                Hometown = employeeData.Hometown,

                IdentityNumber = employeeData.IdentityNumber,
                FixedSalary = employeeData.FixedSalary
            };

            var penalties = _context.PenaltyPayments
                .Where(p => p.EmployeeId == id)
                .Select(p => new { p.Amount, p.Note })
                .ToList();

            employeeDTO.PenaltyAmount = penalties.Sum(p => p.Amount);
            employeeDTO.Note = string.Join(", ", penalties.Select(p => p.Note));

            return Ok(employeeDTO);

        }

        [HttpPut("update-employee/{id}")]
        public IActionResult UpdateEmployee(int id, [FromBody] EmployeeDTO request)
        {
            var employee = _context.Employees.Include(a => a.Salaries).FirstOrDefault(e => e.EmployeeId == id);
            if (employee == null)
            {
                return NotFound(new { message = "Employee not found!" });
            }

            bool exists = _context.Employees.Any(e =>
                (e.IdentityNumber == request.IdentityNumber || e.Phone == request.PhoneNumber)
                && e.EmployeeId != id);
            if (exists)
            {
                return BadRequest(new { message = "Identity number or phone number already exists!" });
            }

            // Cập nhật thông tin nhân viên
            employee.ProfileImage = request.Image ?? employee.ProfileImage;
            employee.FullName = request.FullName ?? employee.FullName;
            employee.Gender = request.Gender ?? employee.Gender;
            employee.BirthDate = request.BirthDate;
            employee.IdentityNumber = request.IdentityNumber ?? employee.IdentityNumber;
            employee.Hometown = request.Hometown ?? employee.Hometown;
            //employee.ProfileImage = request.CurrentAddress ?? employee.ProfileImage;
            employee.Phone = request.PhoneNumber ?? employee.Phone;
            employee.WorkShiftId = request.WorkShiftId ?? employee.WorkShiftId;
            employee.FixedSalary = request.FixedSalary ?? employee.FixedSalary;
            employee.IsActive = request.ActiveStatus ?? employee.IsActive;
            employee.BranchId = request.BranchId ?? employee.BranchId;

            _context.SaveChanges();
            if (employee.Salaries != null)
            {
                foreach (var item in employee.Salaries)
                {
                    item.FixedSalary = request.FixedSalary;
                    _context.Salaries.Update(item);
                    _context.SaveChanges();
                }
            }

            _context.SaveChanges();


            return Ok(new { message = "Cập nhật thông tin nhân viên thành công!" });
        }
        [HttpPut("update-employee-workshift/{id}")]

        public async Task<IActionResult> UpdateEmployeeWorkShift(int id, [FromBody] UpdateWorkShiftDTO request)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên!" });
            }

            employee.WorkShiftId = request.WorkShiftId ?? employee.WorkShiftId;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật ca làm việc thành công!" });
        }
        [HttpPut("update-employee-Active/{id}")]

        public async Task<IActionResult> UpdateEmployeeActi(int id, [FromBody] UpdateActive request)
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeId == id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên!" });
            }

            employee.IsActive = request.IsActive ?? employee.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật ca làm việc thành công!" });
        }
        [HttpPost("add-employee")]
        public async Task<IActionResult> AddStaff([FromForm] AddEmployeeDTO? request, IFormFile avatar)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request data!" });
            }

            bool exists = _context.Employees.Any(e => e.IdentityNumber == request.IdentityNumber || e.Phone == request.PhoneNumber);
            if (exists)
            {
                return BadRequest(new { message = "Identity number or phone number already exists!" });
            }

            // Xử lý file ảnh nếu có
            string imagePath = null;
            string imageFormat = null; // Lưu định dạng ảnh (từ Image.RawFormat)
            try
            {
                if (avatar != null && avatar.Length > 0)
                {
                    // Đọc dữ liệu ảnh từ stream
                    using (var stream = new MemoryStream())
                    {
                        await avatar.CopyToAsync(stream);
                        stream.Position = 0;

                        // Sử dụng System.Drawing để kiểm tra và xử lý ảnh
                        using (var img = Image.FromStream(stream))
                        {
                            imageFormat = img.RawFormat.ToString(); // Lấy định dạng ảnh (JPEG, PNG, etc.)

                            // Tạo thư mục 'access' nếu chưa có
                            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "access");
                            if (!Directory.Exists(folderPath))
                            {
                                Directory.CreateDirectory(folderPath);
                            }

                            // Lấy phần mở rộng từ tên file gốc
                            var fileExtension = Path.GetExtension(avatar.FileName)?.ToLower();
                            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                            var filePath = Path.Combine(folderPath, uniqueFileName);

                            // Lưu ảnh vào thư mục
                            stream.Position = 0; // Reset vị trí stream để lưu file
                            using (var fileStream = new FileStream(filePath, FileMode.Create))
                            {
                                await stream.CopyToAsync(fileStream);
                            }

                            // Lưu đường dẫn ảnh
                            imagePath = $"/access/{uniqueFileName}";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Error processing image: {ex.Message}" });
            }

            // Tạo tài khoản mới cho nhân viên
            var newAccount = new Account
            {
                Username = request.Username,
                PasswordHash = request.PasswordHash, // Bạn có thể sử dụng BCrypt để hash mật khẩu nếu cần
                Role = "Staff",
                EmployeeId = request.Id
            };

            _context.Accounts.Add(newAccount);
            await _context.SaveChangesAsync();

            // Tạo nhân viên mới
            var newEmployee = new Employee
            {
                ProfileImage = imagePath, // Lưu đường dẫn file ảnh
                FullName = request.FullName,
                Gender = request.Gender,
                BirthDate = request.BirthDate,
                IdentityNumber = request.IdentityNumber,
                Hometown = request.Hometown,
                Phone = request.PhoneNumber,

                WorkShiftId = request.WorkShiftId,
                FixedSalary = request.FixedSalary,
                IsActive = true,
                StartDate = DateTime.Now,
                BranchId = request.BranchId,
                AccountId = newAccount.AccountId,
            };

            _context.Employees.Add(newEmployee);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Staff added successfully!",
                EmployeeId = newEmployee.EmployeeId,
                ImageFormat = imageFormat // Trả về định dạng ảnh nếu có
            });
        }

        //[HttpPost("add-employee")]
        //public IActionResult AddEmployee([FromBody] EmployeeDTO request)
        //{
        //    if (request == null)
        //    {
        //        return BadRequest(new { message = "Invalid request data!" });
        //    }

        //    bool exists = _context.Employees.Any(e => e.IdentityNumber == request.IdentityNumber || e.PhoneNumber == request.PhoneNumber);
        //    if (exists)
        //    {
        //        return BadRequest(new { message = "Identity number or phone number already exists!" });
        //    }

        //    var newEmployee = new Employee
        //    {
        //        Image = request.Image,
        //        FullName = request.FullName,
        //        Gender = request.Gender,
        //        BirthDate = request.BirthDate,
        //        IdentityNumber = request.IdentityNumber,
        //        Hometown = request.Hometown,
        //        CurrentAddress = request.CurrentAddress,
        //        PhoneNumber = request.PhoneNumber,
        //        WorkShiftId = request.WorkShiftId,
        //        FixedSalary = request.FixedSalary,
        //        ActiveStatus = request.ActiveStatus ?? true, 
        //        StartDate =  DateTime.Now,
        //        BranchId = request.BranchId
        //    };

        //    _context.Employees.Add(newEmployee);
        //    _context.SaveChanges();

        //    return Ok(new { message = "Employee added successfully!", EmployeeId = newEmployee.Id });
        //}
        [HttpPost("import")]
        public IActionResult ImportStaff(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn file để upload!" });
            }

            var employees = new List<Employee>();
            var accounts = new List<Account>();
            var existingPhoneNumbers = _context.Employees.Select(e => e.Phone).ToHashSet();
            var existingIdentityNumbers = _context.Employees.Select(e => e.IdentityNumber).ToHashSet();
            var newPhoneNumbers = new HashSet<string>();
            var newIdentityNumbers = new HashSet<string>();

            var extension = Path.GetExtension(file.FileName).ToLower();

            if (extension == ".xlsx" || extension == ".xls")
            {
                using (var stream = new MemoryStream())
                {
                    file.CopyTo(stream);
                    using (var package = new ExcelPackage(stream))
                    {
                        ExcelWorksheet worksheet = package.Workbook.Worksheets[0];
                        int rowCount = worksheet.Dimension.Rows;
                        var duplicateEntries = new List<string>();

                        for (int row = 2; row <= rowCount; row++)
                        {
                            string phoneNumber = worksheet.Cells[row, 7].Value?.ToString()?.Trim();
                            string identityNumber = worksheet.Cells[row, 4].Value?.ToString()?.Trim();

                            if (string.IsNullOrWhiteSpace(phoneNumber) || string.IsNullOrWhiteSpace(identityNumber))
                            {
                                duplicateEntries.Add($"Dòng {row}: Thiếu số điện thoại hoặc CCCD");
                                continue;
                            }

                            if (existingPhoneNumbers.Contains(phoneNumber) || newPhoneNumbers.Contains(phoneNumber) ||
                                existingIdentityNumbers.Contains(identityNumber) || newIdentityNumbers.Contains(identityNumber))
                            {
                                duplicateEntries.Add($"Dòng {row}: Số điện thoại {phoneNumber} hoặc CCCD {identityNumber} đã tồn tại");
                                continue;
                            }

                            newPhoneNumbers.Add(phoneNumber);
                            newIdentityNumbers.Add(identityNumber);

                            DateTime? birthDate = null;
                            if (DateTime.TryParse(worksheet.Cells[row, 3].Value?.ToString(), out DateTime parsedBirthDate))
                            {
                                birthDate = parsedBirthDate;
                            }

                            int? workShiftId = null;
                            if (int.TryParse(worksheet.Cells[row, 8].Value?.ToString(), out int shiftId))
                            {
                                workShiftId = shiftId;
                            }

                            int? fixedSalary = null;
                            if (int.TryParse(worksheet.Cells[row, 9].Value?.ToString(), out int salary))
                            {
                                fixedSalary = salary;
                            }

                            int? branchId = null;
                            if (int.TryParse(worksheet.Cells[row, 10].Value?.ToString(), out int parsedBranchId))
                            {
                                branchId = parsedBranchId;
                            }

                            var employee = new Employee
                            {
                                FullName = worksheet.Cells[row, 1].Value?.ToString()?.Trim(),
                                Gender = worksheet.Cells[row, 2].Value?.ToString()?.Trim(),
                                BirthDate = birthDate ?? DateTime.MinValue,
                                IdentityNumber = identityNumber,
                                Hometown = worksheet.Cells[row, 5].Value?.ToString()?.Trim(),
                                Phone = phoneNumber,
                                WorkShiftId = workShiftId,
                                FixedSalary = fixedSalary,
                                IsActive = true,
                                StartDate = DateTime.Now,
                                BranchId = branchId
                            };

                            employees.Add(employee);
                        }

                        if (duplicateEntries.Count > 0)
                        {
                            return BadRequest(new
                            {
                                message = "Có lỗi trong file import!",
                                errors = duplicateEntries
                            });
                        }
                    }
                }
            }
            else
            {
                return BadRequest(new { message = "Chỉ hỗ trợ file Excel (.xlsx, .xls)!" });
            }

            _context.Employees.AddRange(employees);
            _context.SaveChanges();

            foreach (var emp in employees)
            {
                accounts.Add(new Account
                {
                    EmployeeId = emp.EmployeeId,
                    Username = emp.Phone, // Dùng số điện thoại làm username mặc định
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), // Mật khẩu mặc định
                    Role = "Staff"
                });
            }

            _context.Accounts.AddRange(accounts);
            _context.SaveChanges();

            return Ok(new { message = "Import thành công!", totalEmployees = employees.Count });
        }
        [HttpGet("export")]
        public async Task<IActionResult> ExportStaff([FromQuery] int month, [FromQuery] int year)
        {
            // Lấy danh sách nhân viên với thông tin tài khoản
            var staffList = await _context.Employees
                .Join(_context.Accounts,
                      e => e.AccountId,
                      a => a.AccountId,
                      (e, a) => new { Employee = e, Account = a })
                .Where(ea => ea.Account.Role == "Staff" && ea.Employee.IsActive == true)
                .ToListAsync();

            var employeeIds = staffList.Select(ea => ea.Employee.EmployeeId).ToList();

            // Tính TotalWorkDays từ AttendanceCheckIns và AttendanceCheckOuts
            var attendanceData = await _context.AttendanceCheckIns
                .Where(ci => employeeIds.Contains(ci.EmployeeId) &&
                             ci.AttendanceDate.Month == month &&
                             ci.AttendanceDate.Year == year)
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new { ci.EmployeeId, ci.AttendanceDate })
                .ToListAsync();

            var workDaysDict = attendanceData
                .GroupBy(x => new { x.EmployeeId, x.AttendanceDate })
                .Select(g => new { g.Key.EmployeeId, g.Key.AttendanceDate })
                .GroupBy(x => x.EmployeeId)
                .ToDictionary(g => g.Key, g => g.Count());

            // Tính TotalOvertimeHours từ OvertimeRecords
            var overtimeData = await _context.OvertimeRecords
                .Where(o => employeeIds.Contains(o.EmployeeId) &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .GroupBy(o => o.EmployeeId)
                .Select(g => new { EmployeeId = g.Key, TotalOvertimeHours = g.Sum(o => o.TotalHours) })
                .ToDictionaryAsync(g => g.EmployeeId, g => g.TotalOvertimeHours);

            // Tạo file Excel
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Staff Data");

            var headers = new string[]
            {
        "EmployeeID", "FullName", "Gender", "BirthDate", "PhoneNumber", "IdentityNumber", "Hometown",
        "WorkShiftID", "FixedSalary", "ActiveStatus", "StartDate", "BranchID", "Username", "Role",
        "TotalWorkDays", "TotalOvertimeHours"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cell(1, i + 1).Value = headers[i];
            }

            int row = 2;
            foreach (var staff in staffList)
            {
                var emp = staff.Employee;
                var acc = staff.Account;

                worksheet.Cell(row, 1).Value = emp.EmployeeId;
                worksheet.Cell(row, 2).Value = emp.FullName;
                worksheet.Cell(row, 3).Value = emp.Gender;
                worksheet.Cell(row, 4).Value = emp.BirthDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 5).Value = emp.Phone;
                worksheet.Cell(row, 6).Value = emp.IdentityNumber;
                worksheet.Cell(row, 7).Value = emp.Hometown;
                worksheet.Cell(row, 8).Value = emp.WorkShiftId.HasValue ? emp.WorkShiftId.Value.ToString() : "";
                worksheet.Cell(row, 9).Value = emp.FixedSalary.HasValue ? emp.FixedSalary.Value.ToString() : "0";
                worksheet.Cell(row, 10).Value = emp.IsActive.HasValue && emp.IsActive.Value ? "True" : "False";
                worksheet.Cell(row, 11).Value = emp.StartDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 12).Value = emp.BranchId.HasValue ? emp.BranchId.Value.ToString() : "";
                worksheet.Cell(row, 13).Value = acc.Username;
                worksheet.Cell(row, 14).Value = acc.Role == "Staff" ? "Staff" : "Unknown";
                worksheet.Cell(row, 15).Value = workDaysDict.ContainsKey(emp.EmployeeId) ? workDaysDict[emp.EmployeeId].ToString() : "0";
                worksheet.Cell(row, 16).Value = overtimeData.ContainsKey(emp.EmployeeId) ? overtimeData[emp.EmployeeId].ToString("F2") : "0.00";

                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"StaffList_{month}_{year}.xlsx");
        }
        [HttpPost("auto-schedule")]
        public IActionResult AutoScheduleStaff()
        {
            try
            {
                TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                DateTime vietnamNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
                int currentMonth = vietnamNow.Month;
                int currentYear = vietnamNow.Year;
                Calendar calendar = CultureInfo.InvariantCulture.Calendar;
                int currentWeek = calendar.GetWeekOfYear(vietnamNow, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
                var shiftSetting = _context.ShiftSettings
                    .FirstOrDefault(s => s.Month == currentMonth && s.Year == currentYear);

                if (shiftSetting == null)
                {
                    return BadRequest(new { message = "Chưa có cài đặt ca làm việc cho tháng này!" });
                }

                int totalShiftsPerMonth = shiftSetting.TotalShifts;
                var staffList = _context.Employees
                    .Join(_context.Accounts,
                          e => e.AccountId,
                          a => a.AccountId,
                          (e, a) => new { Employee = e, Account = a })
                    .Where(ea => ea.Account.Role == "Staff" && ea.Employee.IsActive == true)
                    .Select(ea => new
                    {
                        ea.Employee.EmployeeId,
                        ea.Employee.FullName,
                        CurrentShiftId = ea.Employee.WorkShiftId
                    })
                    .ToList();

                const int morningShiftId = 1;
                const int afternoonShiftId = 2;
                int daysInMonth = DateTime.DaysInMonth(currentYear, currentMonth);
                int shiftsAssigned = 0;

                foreach (var staff in staffList)
                {
                    if (shiftsAssigned >= totalShiftsPerMonth * staffList.Count)
                    {
                        break;
                    }

                    int newShiftId = (currentWeek % 2 == 0) ? morningShiftId : afternoonShiftId;
                    var employee = _context.Employees.FirstOrDefault(e => e.EmployeeId == staff.EmployeeId);
                    if (employee != null && employee.WorkShiftId != newShiftId)
                    {
                        employee.WorkShiftId = newShiftId;
                        shiftsAssigned++;
                    }
                }

                _context.SaveChanges();
                return Ok(new { message = "Lịch làm việc đã được tự động xếp thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Đã xảy ra lỗi khi xếp lịch: " + ex.Message });
            }
        }
        [HttpGet("ApprovedOvertimeList")]
        public async Task<IActionResult> GetApprovedOvertimeList([FromQuery] int? employeeId, [FromQuery] int month, [FromQuery] int year)
        {
            // Kiểm tra tham số đầu vào
            if (month < 1 || month > 12)
                return BadRequest(new { Message = "Invalid month. Must be between 1 and 12." });
            if (year < 2000)
                return BadRequest(new { Message = "Invalid year. Must be 2000 or later." });
            if (employeeId.HasValue && employeeId <= 0)
                return BadRequest(new { Message = "Invalid Employee ID." });

            var query = _context.OvertimeRecords
                .Where(o => o.Date.Month == month && o.Date.Year == year);

            // Nếu employeeId không null, lọc theo employeeId
            if (employeeId.HasValue)
            {
                query = query.Where(o => o.EmployeeId == employeeId.Value);
            }

            var records = await query
                .Join(_context.Employees,
                    o => o.EmployeeId,
                    e => e.EmployeeId,
                    (o, e) => new
                    {
                        OvertimeId = o.Id,
                        EmployeeName = e.FullName,
                        Date = o.Date.ToString("dd/MM/yyyy"),
                        TotalHours = o.TotalHours,
                        Reason = o.Reason,
                        IsApproved = o.IsApproved,
                        IsRejected = o.IsRejected
                    })
                .ToListAsync();

            return Ok(new { approvedOvertimeRecords = records });
        }
        [HttpGet("download-template")]
        public IActionResult DownloadTemplate()
        {
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Staff Template");
                worksheet.Cell(1, 1).Value = "Full Name";
                worksheet.Cell(1, 2).Value = "Gender";
                worksheet.Cell(1, 3).Value = "Birth Date (yyyy-MM-dd)";
                worksheet.Cell(1, 4).Value = "Identity Number";
                worksheet.Cell(1, 5).Value = "Hometown";
                worksheet.Cell(1, 6).Value = "Current Address";
                worksheet.Cell(1, 7).Value = "Phone Number";
                worksheet.Cell(1, 8).Value = "Work Shift ID";
                worksheet.Cell(1, 9).Value = "Fixed Salary";
                worksheet.Cell(1, 10).Value = "Branch ID";
                worksheet.Cell(1, 11).Value = "Role (Staff=2, Admin=1)";

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Staff_Template.xlsx");
                }
            }
        }

    }

}

