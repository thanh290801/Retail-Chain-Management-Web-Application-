using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging; // Thêm namespace cho logging
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
        private readonly ILogger<AutoPayrollService> _logger;

        public AutoPayrollService(IServiceProvider serviceProvider, ILogger<AutoPayrollService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoPayrollService started at {Time}", DateTime.UtcNow);

            // Lấy thời gian hiện tại theo giờ Việt Nam
            TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            DateTime currentDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            _logger.LogInformation("Current date: {Date}", currentDate);

            // Chạy ngay lập tức khi khởi động để kiểm tra
            _logger.LogInformation("Running payroll immediately for testing.");
            await ProcessPayroll(currentDate);

            // Sau đó vào vòng lặp kiểm tra mỗi 24 giờ (giữ logic ngày 4 nếu cần)
            while (!stoppingToken.IsCancellationRequested)
            {
                currentDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
                _logger.LogInformation("Loop check - Current date: {Date}", currentDate);

                if (currentDate.Day == 4) // Giữ logic ngày 4 như yêu cầu ban đầu
                {
                    _logger.LogInformation("Day is 4, processing payroll.");
                    await ProcessPayroll(currentDate);
                }

                _logger.LogInformation("Waiting 24 hours for next check.");
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task ProcessPayroll(DateTime currentDate)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<RetailChainContext>();
                    _logger.LogInformation("Processing payroll for date: {Date}", currentDate);

                    DateTime payrollDate = currentDate.AddMonths(-1);
                    int payrollMonth = payrollDate.Month;
                    int payrollYear = payrollDate.Year;
                    _logger.LogInformation("Payroll for month: {Month}/{Year}", payrollMonth, payrollYear);

                    var salaryRecords = await context.Salaries
                        .Include(s => s.Employee)
                        .Where(s => s.StartDate.HasValue &&
                                   s.StartDate.Value.Month == payrollMonth &&
                                   s.StartDate.Value.Year == payrollYear &&
                                   s.FinalSalary > 0)
                        .ToListAsync();

                    _logger.LogInformation("Found {Count} salary records.", salaryRecords.Count);

                    if (salaryRecords.Count == 0)
                    {
                        _logger.LogWarning("No salary records found for processing.");
                        return;
                    }

                    foreach (var salaryRecord in salaryRecords)
                    {
                        decimal totalPaid = await context.SalaryPaymentHistories
                            .Where(p => p.EmployeeId == salaryRecord.EmployeeId &&
                                       p.PaymentDate.HasValue &&
                                       p.PaymentDate.Value.Month == payrollMonth &&
                                       p.PaymentDate.Value.Year == payrollYear &&
                                       p.IsDeleted == false)
                            .SumAsync(p => p.PaidAmount);

                        decimal remainingAmount = (salaryRecord.FinalSalary ?? 0) - totalPaid;
                        _logger.LogInformation("EmployeeId: {Id}, FinalSalary: {Final}, TotalPaid: {Paid}, Remaining: {Remaining}",
                            salaryRecord.EmployeeId, salaryRecord.FinalSalary, totalPaid, remainingAmount);

                        if (remainingAmount > 0)
                        {
                            var paymentHistory = new SalaryPaymentHistory
                            {
                                EmployeeId = salaryRecord.EmployeeId,
                                SalaryId = salaryRecord.SalaryId,
                                PaymentDate = currentDate,
                                PaidAmount = (int)remainingAmount,
                                Note = $"Thanh toán tự động lương tháng {payrollMonth}/{payrollYear} vào ngày {currentDate.Day}/{currentDate.Month}/{currentDate.Year} (kiểm tra thủ công)",
                                IsDeleted = false
                            };

                            context.SalaryPaymentHistories.Add(paymentHistory);
                            _logger.LogInformation("Added payment for EmployeeId: {Id}, Amount: {Amount}", salaryRecord.EmployeeId, remainingAmount);
                        }
                        else
                        {
                            _logger.LogInformation("No payment needed for EmployeeId: {Id}, already fully paid.", salaryRecord.EmployeeId);
                        }
                    }

                    await context.SaveChangesAsync();
                    _logger.LogInformation("Payroll processing completed successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing payroll.");
            }
        }
    }
}