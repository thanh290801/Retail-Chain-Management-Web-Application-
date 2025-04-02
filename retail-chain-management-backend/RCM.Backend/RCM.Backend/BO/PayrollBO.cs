using RCM.Backend.DTO;
using RCM.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static RCM.Backend.DTOs.ShiftDTO;

namespace RCM.Backend
{
    public class PayrollBO
    {
        private readonly IPayrollRepository _repository;
        private const decimal OvertimeRate = 50000;

        public PayrollBO(IPayrollRepository repository)
        {
            _repository = repository;
        }

        public async Task SetupShiftsAsync(ShiftSettingDTO request)
        {
            if (request.TotalShifts <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000)
            {
                throw new ArgumentException("Dữ liệu không hợp lệ.");
            }

            var existingSetting = await _repository.GetShiftSettingAsync(request.Month, request.Year);
            if (existingSetting != null)
            {
                existingSetting.TotalShifts = request.TotalShifts;
                await _repository.UpdateAsync(existingSetting);
            }
            else
            {
                await _repository.AddAsync(new ShiftSetting
                {
                    Month = request.Month,
                    Year = request.Year,
                    TotalShifts = request.TotalShifts
                });
            }
            await _repository.SaveChangesAsync();
        }

        public async Task<List<object>> CalculateAndSavePayrollAsync(string staffId, string search, int month, int year, bool forceRecalculate)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            var shiftSetting = await _repository.GetShiftSettingAsync(month, year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var employees = await _repository.GetEmployeesAsync(search, staffId);
            var employeeIds = employees.Select(e => e.EmployeeId).ToList();

            var existingSalaries = await _repository.GetSalariesByMonthAsync(month, year);
            bool payrollCalculated = existingSalaries.Any(s => s.IsCalculated == true);

            if (!payrollCalculated || forceRecalculate)
            {
                if (forceRecalculate)
                {
                    await _repository.DeleteRangeAsync(existingSalaries);
                    await _repository.SaveChangesAsync();
                }

                foreach (var employee in employees)
                {
                    int totalWorkDays = await _repository.GetTotalWorkDaysAsync(employee.EmployeeId, month, year);
                    decimal totalOvertimeHours = await _repository.GetTotalOvertimeHoursAsync(employee.EmployeeId, month, year);
                    decimal overtimePay = totalOvertimeHours * OvertimeRate;
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
                    await _repository.AddAsync(salaryRecord);
                }
                await _repository.SaveChangesAsync();
            }

            var salaryRecords = new List<object>();
            foreach (var employee in employees)
            {
                var salaryRecord = existingSalaries.FirstOrDefault(s => s.EmployeeId == employee.EmployeeId);
                if (salaryRecord == null) continue;

                bool hasReceivedSalary = await _repository.GetTotalPaidAmountAsync(employee.EmployeeId, month, year) > 0;
                decimal totalOvertimeHours = await _repository.GetTotalOvertimeHoursAsync(employee.EmployeeId, month, year);
                decimal overtimePay = totalOvertimeHours * OvertimeRate;

                salaryRecords.Add(new
                {
                    salaryRecord.EmployeeId,
                    EmployeeName = employee.FullName,
                    Phone = employee.Phone,
                    FixedSalary = employee.FixedSalary ?? 0,
                    SalaryPerShift = salaryRecord.SalaryPerShift ?? 0,
                    TotalWorkDays = salaryRecord.WorkingDays ?? 0,
                    TotalShiftInMonth = totalShiftsInMonth,
                    FinalSalary = salaryRecord.FinalSalary ?? 0,
                    TotalOvertimeHours = salaryRecord.BonusHours ?? (int)totalOvertimeHours,
                    OvertimePay = salaryRecord.BonusSalary ?? (int)overtimePay,
                    TotalSalary = salaryRecord.FinalSalary ?? 0,
                    IdentityNumber = employee.IdentityNumber,
                    Hometown = employee.Hometown,
                    PaymentStatus = hasReceivedSalary ? "Đã thanh toán" : "Chưa thanh toán"
                });
            }

            return salaryRecords;
        }

        public async Task<List<Salary>> GetSalaryListAsync(string search, int? month, int? year)
        {
            var salaries = await _repository.GetSalariesByMonthAsync(month ?? DateTime.Now.Month, year ?? DateTime.Now.Year);
            return salaries;
        }

        public async Task AddToSalaryRecordAsync(AddSalaryRequestDTO request)
        {
            var fixedSalary = request.FixedSalary;
            int month = request.Month;
            int year = request.Year;
            int staffId = request.StaffId;

            bool hasReceivedSalary = await _repository.GetTotalPaidAmountAsync(staffId, month, year) > 0;
            if (hasReceivedSalary)
            {
                throw new InvalidOperationException("Không thể tính lại lương vì lương đã được thanh toán.");
            }

            var shiftSetting = await _repository.GetShiftSettingAsync(month, year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            int totalWorkDays = await _repository.GetTotalWorkDaysAsync(staffId, month, year);
            decimal totalOvertimeHours = await _repository.GetTotalOvertimeHoursAsync(staffId, month, year);
            decimal overtimePay = totalOvertimeHours * OvertimeRate;
            decimal salaryPerShift = fixedSalary / totalShiftsInMonth;
            decimal baseSalary = salaryPerShift * totalWorkDays;

            var payrollExists = await _repository.GetSalaryByEmployeeAndMonthAsync(staffId, month, year);
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            if (payrollExists != null)
            {
                payrollExists.UpdateAt = DateTime.Now;
                payrollExists.EmployeeId = staffId;
                payrollExists.WorkingDays = totalWorkDays;
                payrollExists.FixedSalary = fixedSalary;
                payrollExists.StartDate = startDate;
                payrollExists.EndDate = endDate;
                payrollExists.SalaryPerShift = (int)salaryPerShift;
                payrollExists.BonusSalary = request.BonusSalary;
                payrollExists.Penalty = request.PenaltyAmount;
                payrollExists.BonusHours = (int)totalOvertimeHours;
                payrollExists.FinalSalary = (int)(salaryPerShift * totalWorkDays + request.BonusSalary - request.PenaltyAmount + overtimePay);
                await _repository.UpdateAsync(payrollExists);
            }
            else
            {
                var salaryRecord = new Salary
                {
                    UpdateAt = DateTime.Now,
                    EmployeeId = staffId,
                    WorkingDays = totalWorkDays,
                    FixedSalary = fixedSalary,
                    StartDate = startDate,
                    EndDate = endDate,
                    SalaryPerShift = (int)salaryPerShift,
                    BonusSalary = request.BonusSalary,
                    Penalty = request.PenaltyAmount,
                    BonusHours = (int)totalOvertimeHours,
                    FinalSalary = (int)(salaryPerShift * totalWorkDays + request.BonusSalary - request.PenaltyAmount + overtimePay)
                };
                await _repository.AddAsync(salaryRecord);
            }

            await _repository.SaveChangesAsync();
        }

        public async Task<object> GetPayrollDetailsAsync(int employeeId, int month, int year)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            var shiftSetting = await _repository.GetShiftSettingAsync(month, year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var salaryRecord = await _repository.GetSalaryByEmployeeAndMonthAsync(employeeId, month, year);
            int totalWorkDays = await _repository.GetTotalWorkDaysAsync(employeeId, month, year);
            decimal totalOvertimeHours = await _repository.GetTotalOvertimeHoursAsync(employeeId, month, year);
            decimal overtimePay = totalOvertimeHours * OvertimeRate;
            decimal salaryPerShift = (salaryRecord?.FixedSalary ?? 0) / totalShiftsInMonth;
            decimal baseSalary = salaryPerShift * totalWorkDays;

            var paymentHistory = await _repository.GetPaymentHistoryAsync(employeeId, month, year);

            return new
            {
                EmployeeId = salaryRecord?.EmployeeId ?? employeeId,
                EmployeeName = salaryRecord?.Employee?.FullName ?? "Không xác định",
                Phone = salaryRecord?.Employee?.Phone,
                FixedSalary = salaryRecord?.FixedSalary ?? 0,
                SalaryPerShift = (int)salaryPerShift,
                TotalWorkDays = totalWorkDays,
                TotalOvertimeHours = totalOvertimeHours,
                OvertimePay = (int)overtimePay,
                TotalSalary = salaryRecord?.FinalSalary ?? (int)(baseSalary + overtimePay),
                IdentityNumber = salaryRecord?.Employee?.IdentityNumber,
                Hometown = salaryRecord?.Employee?.Hometown,
                PaymentHistory = paymentHistory.Select(p => new { p.PaymentDate, p.PaidAmount, p.Note })
            };
        }

        public async Task RequestOvertimeAsync(DTOs.ShiftDTO.OvertimeRequestDTO request)
        {
            if (request.EmployeeId <= 0 || request.Date == null || request.TotalHours <= 0)
            {
                throw new ArgumentException("Dữ liệu yêu cầu không hợp lệ.");
            }

            var overtimeRecord = new OvertimeRecord
            {
                EmployeeId = request.EmployeeId,
                Date = request.Date,
                TotalHours = request.TotalHours,
                Reason = request.Reason,
                IsApproved = false
            };

            await _repository.AddAsync(overtimeRecord);
            await _repository.SaveChangesAsync();
        }

        public async Task ApproveOvertimeAsync(int id)
        {
            var overtimeRecord = await _repository.GetOvertimeRecordByIdAsync(id);
            if (overtimeRecord == null)
            {
                throw new KeyNotFoundException("Không tìm thấy yêu cầu làm thêm giờ.");
            }

            if (overtimeRecord.IsApproved)
            {
                throw new InvalidOperationException("Yêu cầu này đã được phê duyệt trước đó.");
            }

            overtimeRecord.IsApproved = true;
            await _repository.UpdateAsync(overtimeRecord);
            await _repository.SaveChangesAsync();
        }

        public async Task PaySalaryAsync(SalaryPaymentDTO request)
        {
            if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount < 0)
            {
                throw new ArgumentException("Dữ liệu yêu cầu không hợp lệ.");
            }

            var salaryRecord = await _repository.GetSalaryByEmployeeAndMonthAsync(request.EmployeeId, request.Month, request.Year);
            if (salaryRecord == null)
            {
                throw new KeyNotFoundException("Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho.");
            }

            if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
            {
                throw new InvalidOperationException("Lương cuối cùng chưa được tính hoặc bằng 0, không thể thanh toán.");
            }

            decimal totalPaid = await _repository.GetTotalPaidAmountAsync(request.EmployeeId, request.Month, request.Year);
            decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

            if (remainingAmount <= 0)
            {
                throw new InvalidOperationException("Lương của nhân viên đã được thanh toán đầy đủ.");
            }

            if (request.PaidAmount > remainingAmount)
            {
                throw new InvalidOperationException($"Số tiền thanh toán ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount}).");
            }

            var paymentHistory = new SalaryPaymentHistory
            {
                EmployeeId = request.EmployeeId,
                SalaryId = salaryRecord.SalaryId,
                PaymentDate = DateTime.Now,
                PaidAmount = request.PaidAmount,
                Note = request.Note ?? $"Thanh toán lương tháng {request.Month}/{request.Year}",
                IsDeleted = false
            };

            await _repository.AddAsync(paymentHistory);
            await _repository.SaveChangesAsync();
        }

        public async Task<List<object>> ListPendingOvertimeRequestsAsync(int? month, int? year, string search)
        {
            return await _repository.GetPendingOvertimeRequestsAsync(month, year, search);
        }

        public async Task AdvanceSalaryAsync(SalaryPaymentDTO request)
        {
            if (request.EmployeeId <= 0 || request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.PaidAmount <= 0)
            {
                throw new ArgumentException("Dữ liệu yêu cầu ứng lương không hợp lệ.");
            }

            var employee = await _repository.GetEmployeeByIdAsync(request.EmployeeId);
            if (employee == null)
            {
                throw new KeyNotFoundException("Không tìm thấy nhân viên.");
            }

            if (employee.StartDate == null || (DateTime.Now - employee.StartDate).TotalDays < 30)
            {
                throw new InvalidOperationException("Nhân viên phải làm việc ít nhất 1 tháng (30 ngày) để được ứng lương.");
            }

            var salaryRecord = await _repository.GetSalaryByEmployeeAndMonthAsync(request.EmployeeId, request.Month, request.Year);
            if (salaryRecord == null)
            {
                throw new KeyNotFoundException("Chưa có bảng lương cho nhân viên trong tháng yêu cầu.");
            }

            if (salaryRecord.FinalSalary == null || salaryRecord.FinalSalary <= 0)
            {
                throw new InvalidOperationException("Lương chưa được tính, không thể ứng lương.");
            }

            int totalWorkDays = await _repository.GetTotalWorkDaysAsync(request.EmployeeId, request.Month, request.Year);
            var shiftSetting = await _repository.GetShiftSettingAsync(request.Month, request.Year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;
            decimal salaryPerShift = (salaryRecord.FixedSalary ?? 0) / totalShiftsInMonth;
            decimal maxAdvanceAmount = (totalWorkDays / 2m) * salaryPerShift;

            decimal totalPaid = await _repository.GetTotalPaidAmountAsync(request.EmployeeId, request.Month, request.Year);
            decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

            if (remainingAmount <= 0)
            {
                throw new InvalidOperationException("Lương đã được thanh toán hoặc ứng đầy đủ.");
            }

            if (request.PaidAmount > maxAdvanceAmount)
            {
                throw new InvalidOperationException($"Số tiền ứng ({request.PaidAmount}) vượt quá giới hạn tối đa ({maxAdvanceAmount}) - 1/2 lương của {totalWorkDays} ngày công.");
            }

            if (request.PaidAmount > remainingAmount)
            {
                throw new InvalidOperationException($"Số tiền ứng ({request.PaidAmount}) vượt quá số tiền còn lại ({remainingAmount}).");
            }

            var advancePayment = new SalaryPaymentHistory
            {
                EmployeeId = request.EmployeeId,
                SalaryId = salaryRecord.SalaryId,
                PaymentDate = DateTime.Now,
                PaidAmount = request.PaidAmount,
                PaymentMethod = 0,
                Note = request.Note ?? $"Ứng lương tháng {request.Month}/{request.Year}",
                IsDeleted = false
            };

            await _repository.AddAsync(advancePayment);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateSalaryAsync(SalaryDTO request)
        {
            if (request == null || request.EmployeeId <= 0 || request.StartDate == null)
            {
                throw new ArgumentException("Dữ liệu yêu cầu không hợp lệ.");
            }

            int month = request.StartDate.Value.Month;
            int year = request.StartDate.Value.Year;

            var shiftSetting = await _repository.GetShiftSettingAsync(month, year);
            int totalShiftsInMonth = shiftSetting?.TotalShifts ?? 26;

            var salaryRecord = await _repository.GetSalaryByEmployeeAndMonthAsync(request.EmployeeId, month, year);
            if (salaryRecord == null)
            {
                throw new KeyNotFoundException("Không tìm thấy bảng lương của nhân viên trong tháng và năm đã cho.");
            }

            bool hasReceivedSalary = await _repository.GetTotalPaidAmountAsync(request.EmployeeId, month, year) > 0;
            if (hasReceivedSalary && request.FixedSalary.HasValue)
            {
                throw new InvalidOperationException("Không thể cập nhật FixedSalary vì lương đã được thanh toán.");
            }

            int totalWorkDays = await _repository.GetTotalWorkDaysAsync(request.EmployeeId, month, year);
            decimal totalOvertimeHours = await _repository.GetTotalOvertimeHoursAsync(request.EmployeeId, month, year);
            decimal overtimePay = totalOvertimeHours * OvertimeRate;

            if (!hasReceivedSalary && request.FixedSalary.HasValue)
            {
                if (request.FixedSalary < 0)
                {
                    throw new ArgumentException("FixedSalary không thể là số âm.");
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

            await _repository.UpdateAsync(salaryRecord);
            await _repository.SaveChangesAsync();
        }

        // Các phương thức công khai để Controller gọi
        public async Task<Salary> GetSalaryByEmployeeAndMonthAsync(int employeeId, int month, int year)
        {
            return await _repository.GetSalaryByEmployeeAndMonthAsync(employeeId, month, year);
        }

        public async Task<decimal> GetTotalPaidAmountAsync(int employeeId, int month, int year)
        {
            return await _repository.GetTotalPaidAmountAsync(employeeId, month, year);
        }
    }
}