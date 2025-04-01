using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static RCM.Backend.DTOs.ShiftDTO;

namespace RCM.Backend
{
    public interface IPayrollRepository
    {
        Task<ShiftSetting> GetShiftSettingAsync(int month, int year);
        Task<Salary> GetSalaryByEmployeeAndMonthAsync(int employeeId, int month, int year);
        Task<List<Salary>> GetSalariesByMonthAsync(int month, int year);
        Task<List<Employee>> GetEmployeesAsync(string search = null, string staffId = null);
        Task<List<AttendanceCheckIn>> GetAttendanceCheckInsAsync(int employeeId, int month, int year);
        Task<List<AttendanceCheckOut>> GetAttendanceCheckOutsAsync(int employeeId, int month, int year);
        Task<List<OvertimeRecord>> GetOvertimeRecordsAsync(int employeeId, int month, int year);
        Task<decimal> GetTotalOvertimeHoursAsync(int employeeId, int month, int year);
        Task<int> GetTotalWorkDaysAsync(int employeeId, int month, int year);
        Task<decimal> GetTotalPaidAmountAsync(int employeeId, int month, int year);
        Task<Employee> GetEmployeeByIdAsync(int employeeId);
        Task<List<SalaryPaymentHistory>> GetPaymentHistoryAsync(int employeeId, int month, int year);
        Task<List<object>> GetPendingOvertimeRequestsAsync(int? month, int? year, string search);
        Task<OvertimeRecord> GetOvertimeRecordByIdAsync(int id);
        Task AddAsync<T>(T entity) where T : class;
        Task UpdateAsync<T>(T entity) where T : class;
        Task DeleteRangeAsync<T>(IEnumerable<T> entities) where T : class;
        Task SaveChangesAsync();
    }

    public class PayrollRepository : IPayrollRepository
    {
        private readonly RetailChainContext _context;

        public PayrollRepository(RetailChainContext context)
        {
            _context = context;
        }

        public async Task<ShiftSetting> GetShiftSettingAsync(int month, int year)
        {
            return await _context.ShiftSettings
                .FirstOrDefaultAsync(s => s.Month == month && s.Year == year);
        }

        public async Task<Salary> GetSalaryByEmployeeAndMonthAsync(int employeeId, int month, int year)
        {
            return await _context.Salaries
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId &&
                                         s.StartDate.HasValue &&
                                         s.StartDate.Value.Month == month &&
                                         s.StartDate.Value.Year == year);
        }

        public async Task<List<Salary>> GetSalariesByMonthAsync(int month, int year)
        {
            return await _context.Salaries
                .Where(s => s.StartDate.HasValue &&
                            s.StartDate.Value.Month == month &&
                            s.StartDate.Value.Year == year)
                .ToListAsync();
        }

        public async Task<List<Employee>> GetEmployeesAsync(string search = null, string staffId = null)
        {
            var query = _context.Employees.AsNoTracking();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e => e.FullName.Contains(search) || e.Phone.Contains(search));
            }
            if (!string.IsNullOrEmpty(staffId))
            {
                query = query.Where(e => e.EmployeeId.ToString() == staffId);
            }
            return await query.ToListAsync();
        }

        public async Task<List<AttendanceCheckIn>> GetAttendanceCheckInsAsync(int employeeId, int month, int year)
        {
            return await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == employeeId &&
                            ci.AttendanceDate.Month == month &&
                            ci.AttendanceDate.Year == year)
                .ToListAsync();
        }

        public async Task<List<AttendanceCheckOut>> GetAttendanceCheckOutsAsync(int employeeId, int month, int year)
        {
            return await _context.AttendanceCheckOuts
                .Where(co => co.EmployeeId == employeeId &&
                            co.AttendanceDate.Month == month &&
                            co.AttendanceDate.Year == year)
                .ToListAsync();
        }

        public async Task<List<OvertimeRecord>> GetOvertimeRecordsAsync(int employeeId, int month, int year)
        {
            return await _context.OvertimeRecords
                .Where(o => o.EmployeeId == employeeId &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalOvertimeHoursAsync(int employeeId, int month, int year)
        {
            return await _context.OvertimeRecords
                .Where(o => o.EmployeeId == employeeId &&
                            o.Date.Month == month &&
                            o.Date.Year == year &&
                            o.IsApproved == true)
                .SumAsync(o => o.TotalHours);
        }

        public async Task<int> GetTotalWorkDaysAsync(int employeeId, int month, int year)
        {
            return await _context.AttendanceCheckIns
                .Where(ci => ci.EmployeeId == employeeId &&
                            ci.AttendanceDate.Month == month &&
                            ci.AttendanceDate.Year == year)
                .Join(_context.AttendanceCheckOuts,
                    ci => new { ci.EmployeeId, ci.AttendanceDate, ci.Shift },
                    co => new { co.EmployeeId, co.AttendanceDate, co.Shift },
                    (ci, co) => new { ci.AttendanceDate })
                .Distinct()
                .CountAsync();
        }

        public async Task<decimal> GetTotalPaidAmountAsync(int employeeId, int month, int year)
        {
            return await _context.SalaryPaymentHistories
                .Where(p => p.EmployeeId == employeeId &&
                            p.PaymentDate.HasValue &&
                            p.PaymentDate.Value.Month == month &&
                            p.PaymentDate.Value.Year == year &&
                            p.IsDeleted == false)
                .SumAsync(p => p.PaidAmount);
        }

        public async Task<Employee> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeId == employeeId);
        }

        public async Task<List<SalaryPaymentHistory>> GetPaymentHistoryAsync(int employeeId, int month, int year)
        {
            return await _context.SalaryPaymentHistories
                .Where(p => p.EmployeeId == employeeId &&
                           p.PaymentDate.HasValue &&
                           p.PaymentDate.Value.Month == month &&
                           p.PaymentDate.Value.Year == year)
                .ToListAsync();
        }

        public async Task<List<object>> GetPendingOvertimeRequestsAsync(int? month, int? year, string search)
        {
            var query = _context.OvertimeRecords
                .Where(o => o.IsApproved == false)
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
            {
                query = query.Where(o => o.Date.Month == month.Value && o.Date.Year == year.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(o => o.EmployeeName.Contains(search) || o.Phone.Contains(search));
            }

            return (await query.OrderBy(o => o.Date).ToListAsync()).Cast<object>().ToList();
        }

        public async Task<OvertimeRecord> GetOvertimeRecordByIdAsync(int id)
        {
            return await _context.OvertimeRecords.FindAsync(id);
        }

        public async Task AddAsync<T>(T entity) where T : class
        {
            await _context.AddAsync(entity);
        }

        public async Task UpdateAsync<T>(T entity) where T : class
        {
            _context.Update(entity);
        }

        public async Task DeleteRangeAsync<T>(IEnumerable<T> entities) where T : class
        {
            _context.RemoveRange(entities);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}