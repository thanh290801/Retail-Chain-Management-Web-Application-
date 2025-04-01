using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace RCM.Backend.Services
{
    public class AutoPayrollService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public AutoPayrollService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                // Lấy thời gian hiện tại theo giờ Việt Nam
                TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                DateTime currentDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);

                // Nếu là ngày 5, thực hiện thanh toán lương
                if (currentDate.Day == 5)
                {
                    await ProcessPayroll(currentDate);
                }

                // Đợi 24 giờ trước khi kiểm tra lại
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task ProcessPayroll(DateTime currentDate)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<RetailChainContext>();

                // Xác định tháng và năm trước đó
                DateTime payrollDate = currentDate.AddMonths(-1);
                int payrollMonth = payrollDate.Month;
                int payrollYear = payrollDate.Year;

                // Lấy danh sách lương của tháng trước chưa thanh toán đầy đủ
                var salaryRecords = await context.Salaries
                    .Include(s => s.Employee)
                    .Where(s => s.StartDate.HasValue &&
                               s.StartDate.Value.Month == payrollMonth &&
                               s.StartDate.Value.Year == payrollYear &&
                               s.FinalSalary > 0)
                    .ToListAsync();

                foreach (var salaryRecord in salaryRecords)
                {
                    // Tính tổng số tiền đã thanh toán
                    decimal totalPaid = await context.SalaryPaymentHistories
                        .Where(p => p.EmployeeId == salaryRecord.EmployeeId &&
                                   p.PaymentDate.HasValue &&
                                   p.PaymentDate.Value.Month == payrollMonth &&
                                   p.PaymentDate.Value.Year == payrollYear &&
                                   p.IsDeleted == false)
                        .SumAsync(p => p.PaidAmount);

                    decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;

                    // Nếu còn tiền chưa thanh toán, thực hiện thanh toán tự động
                    if (remainingAmount > 0)
                    {
                        var paymentHistory = new SalaryPaymentHistory
                        {
                            EmployeeId = salaryRecord.EmployeeId,
                            SalaryId = salaryRecord.SalaryId,
                            PaymentDate = currentDate,
                            PaidAmount = (int)remainingAmount, // Thanh toán toàn bộ số tiền còn lại
                            Note = $"Thanh toán tự động lương tháng {payrollMonth}/{payrollYear} vào ngày 5/{currentDate.Month}/{currentDate.Year}",
                            IsDeleted = false
                        };

                        context.SalaryPaymentHistories.Add(paymentHistory);
                    }
                }

                await context.SaveChangesAsync();
            }
        }
    }
}