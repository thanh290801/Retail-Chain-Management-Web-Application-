using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[Authorize]
[Route("api/finance")]
[ApiController]
public class FinancialController : ControllerBase
{
    private readonly RetailChainContext _context;

    public FinancialController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpGet("summaryStaff")]
    public async Task<IActionResult> GetFinancialSummary()
    {
        // Lấy thông tin nhân viên đăng nhập từ token
        var accountIdClaim = User.FindFirst("AccountId")?.Value;
        var branchIdClaim = User.FindFirst("BranchId")?.Value;

        if (!int.TryParse(accountIdClaim, out int empId))
            return Unauthorized("Invalid user");

        if (!int.TryParse(branchIdClaim, out int branchId) || branchId <= 0)
            return BadRequest("Invalid branch ID");
        var employee = await _context.Employees
       .Where(e => e.AccountId == empId)
       .Select(e => new
       {
           FullName = e.FullName,
           BranchId = e.BranchId
       })
       .FirstOrDefaultAsync();
        DateTime today = DateTime.Today;
        DateTime yesterday = today.AddDays(-1);

        var previousDayTransactions = await _context.Transactions
       .Where(t => t.TransactionDate >= yesterday && t.TransactionDate < today && t.BranchId == branchId)
       .GroupBy(t => 1)
       .Select(g => new
       {
           CashSalesYesterday = g.Where(t => t.TransactionType == "POS_CASH_PAYMENT")
                                 .Sum(t => (decimal?)t.Amount) ?? 0,

           CashHandoverIn = g.Where(t => t.TransactionType == "CASH_HANDOVER")
                             .Sum(t => (decimal?)t.Amount) ?? 0,

           CashHandoverOut = g.Where(t => t.TransactionType == "CASH_EXPENSE")
                              .Sum(t => (decimal?)t.Amount) ?? 0,

           Refunds = g.Where(t => t.TransactionType == "CASH_REFUND")
                      .Sum(t => (decimal?)t.Amount) ?? 0
       })
       .FirstOrDefaultAsync();
        // Lấy dữ liệu tài chính từ bảng Transactions (chỉ cần 1 truy vấn duy nhất)
        var financialData = await _context.Transactions
            .Where(t => t.TransactionDate >= today && t.BranchId == branchId)
            .GroupBy(t => 1)
            .Select(g => new
            {
                // Tổng doanh thu POS từ bảng Transactions
                TotalRevenue = g.Where(t => t.TransactionType == "POS_CASH_PAYMENT" || t.TransactionType == "POS_BANK_PAYMENT")
                                .Sum(t => (decimal?)t.Amount) ?? 0,

                // Doanh thu tiền mặt
                CashSales = g.Where(t => t.TransactionType == "POS_CASH_PAYMENT")
                             .Sum(t => (decimal?)t.Amount) ?? 0,

                // Doanh thu chuyển khoản
                BankSales = g.Where(t => t.TransactionType == "POS_BANK_PAYMENT")
                             .Sum(t => (decimal?)t.Amount) ?? 0,
                //tổng thu từ phiếu
                CashHandover = g.Where(t => t.TransactionType == "CASH_HANDOVER")
                              .Sum(t => (decimal?)t.Amount) ?? 0,

                // Tổng chi tiêu từ phiếu
                Expense = g.Where(t => t.TransactionType == "CASH_EXPENSE")
                                .Sum(t => (decimal?)t.Amount) ?? 0,
                //ổng refund
                TotalRefund=g.Where(t=>t.TransactionType== "CASH_REFUND")
                                .Sum (t => (decimal?)t.Amount) ?? 0,
            })
            .FirstOrDefaultAsync();

        // Lấy tồn quỹ đầu ngày từ CashHandover
        decimal openingBalance = previousDayTransactions?.CashSalesYesterday
                           + previousDayTransactions?.CashHandoverIn
                           - previousDayTransactions?.Refunds
                           - previousDayTransactions?.CashHandoverOut ?? 0;

        if (financialData == null)
            return NotFound("No financial data found.");

        decimal currentBalance = openingBalance + financialData.CashHandover + financialData.CashSales - financialData.TotalRefund - financialData.Expense;

        return Ok(new
        {
            totalthu = financialData.CashHandover + financialData.CashSales,
            totalchi= financialData.TotalRefund + financialData.Expense,
            FullName = employee.FullName,
            BranchId = employee.BranchId,
            TotalRevenues = financialData.TotalRevenue,
            CashSale = financialData.CashSales,
            BankSale = financialData.BankSales,
            Expenses = financialData.Expense,
            OpeningBalance = openingBalance,
            CurrentBalance = currentBalance
        });
    }
}
