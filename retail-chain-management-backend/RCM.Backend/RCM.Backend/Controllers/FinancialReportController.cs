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
        var salaries = await _context.Salaries
            .Include(s => s.Employee)
            .Where(s =>
                s.StartDate <= endDate && s.EndDate >= startDate &&  // Lương còn hiệu lực trong tháng
                (branchId == 0 || s.Employee.BranchId == branchId))
            .ToListAsync();

        var salaryList = salaries
         .GroupBy(s => s.EmployeeId)
         .Select(g => g.OrderByDescending(s => s.SalaryId).First()) // Tránh trùng nhân viên
         .Select(s => new
         {
             name = s.Employee.FullName,
             position = "Chức vụ", // Có thể lấy từ bảng khác
             totalSalary = (s.FixedSalary ?? 0) + (s.BonusSalary ?? 0) - (s.Penalty ?? 0)
         }).ToList();

        var totalSalary = salaryList.Sum(s => s.totalSalary);

        // 4. Chi phí nhập hàng
        var purchaseCosts = await _context.PurchaseCosts
            .Where(p => p.RecordedDate >= startDate && p.RecordedDate < endDate
                && (branchId == 0 || p.BranchId == branchId))
            .ToListAsync();

        var totalPurchaseCost = purchaseCosts.Sum(p => p.TotalCost);

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
