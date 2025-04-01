using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

[Route("api/[controller]")]
[ApiController]
public class FinancialReportController : ControllerBase
{
    private readonly RetailChainContext _context;

    public FinancialReportController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpGet("branches")]
    public async Task<IActionResult> GetBranches()
    {
        var branches = await _context.Warehouses
            .Select(w => new { id = w.WarehousesId, name = w.Name })
            .ToListAsync();

        // Thêm tùy chọn "Toàn hệ thống"
        branches.Insert(0, new { id = 0, name = "Toàn hệ thống" });

        return Ok(branches);
    }

    [HttpGet("api/financialreport")]
    public async Task<IActionResult> GetFinancialReport(int month, int year, int branchId)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        // 1. Đơn hàng và doanh thu POS
        var totalOrders = await _context.Orders
            .Where(o => o.CreatedDate >= startDate && o.CreatedDate < endDate
                && (branchId == 0 || o.ShopId == branchId))
            .CountAsync();

        var transactions = await _context.Transactions
            .Where(t => t.TransactionDate >= startDate && t.TransactionDate < endDate
                && (branchId == 0 || t.BranchId == branchId))
            .ToListAsync();

        var totalCash = transactions
            .Where(t => t.TransactionType == "POS_CASH_PAYMENT")
            .Sum(t => t.Amount);

        var totalBank = transactions
            .Where(t => t.TransactionType == "POS_BANK_PAYMENT")
            .Sum(t => t.Amount);

        var totalRevenue = totalCash + totalBank;

        // 2. Hoàn tiền
        var totalRefundAmount = transactions
            .Where(t => t.TransactionType == "CASH_REFUND")
            .Sum(t => t.Amount);

        var totalRefunds = transactions
            .Count(t => t.TransactionType == "CASH_REFUND");

        // 3. Chi phí nhân sự
        var salaryPayments = await _context.SalaryPaymentHistories
            .Include(p => p.Employee)
            .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate
                && !p.IsDeleted
                && (branchId == 0 || p.Employee.BranchId == branchId))
            .ToListAsync();

        var salaryList = salaryPayments
            .GroupBy(p => p.EmployeeId)
            .Select(g => new
            {
                name = g.First().Employee.FullName,
                position = "Chức vụ", // bạn có thể lấy từ bảng khác nếu có
                totalSalary = g.Sum(p => p.PaidAmount)
            }).ToList();

        var totalSalary = salaryList.Sum(s => s.totalSalary);

        // 4. Chi phí nhập hàng
       
        var purchaseCosts = await _context.Transactions
            .Where(t => t.TransactionDate >= startDate && t.TransactionDate < endDate
                && (branchId == 0 || t.BranchId == branchId))
            .ToListAsync();

        var totalPurchaseCost = transactions
            .Where(t => t.TransactionType == "PURCHASEORDER")
            .Sum(t => t.Amount);


        // 5. Lợi nhuận gộp
        var estimatedProfit = totalRevenue - totalRefundAmount - totalSalary - totalPurchaseCost;

        return Ok(new
        {
            totalOrders,
            totalCash,
            totalBank,
            totalRevenue,
            totalRefunds,
            totalRefundAmount,
            salaries = salaryList,
            totalSalary,
            totalPurchaseCost,
            estimatedProfit
        });
    }

}
