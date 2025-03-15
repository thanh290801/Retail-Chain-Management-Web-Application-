using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class FinancialController : ControllerBase
{
    private readonly RetailChainContext _context;

    public FinancialController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpGet("branch-cash-balance")]
    [Authorize]
    public async Task<IActionResult> GetBranchCashBalance()
    {
        try
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            Console.WriteLine("🔍 Claims từ Token:");
            Console.WriteLine(JsonConvert.SerializeObject(claims, Formatting.Indented));
            // 1️⃣ Lấy AccountID từ token
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
            {
                return Unauthorized(new { message = "Không thể xác thực người dùng." });
            }

            int accountId = int.Parse(accountIdClaim);


            // 2️⃣ Tìm nhân viên & chi nhánh của họ
            var employee = await _context.Employees
                .Where(e => e.AccountId == accountId)
                .Select(e => new { e.EmployeeId,e.FullName, e.BranchId })
                .FirstOrDefaultAsync();

            if (employee == null || employee.BranchId == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin nhân viên hoặc chi nhánh." });
            }

            int branchId = employee.BranchId.Value;
            var today = DateTime.Today;
            var yesterday = today.AddDays(-1); // Ngày hôm trước

            // 3️⃣ Doanh thu bán hàng bằng tiền mặt trong ngày
            var cashSales = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == today && ct.BranchID == branchId && ct.TransactionType == "Thu" && ct.SourceType == "POS_CASH_PAYMENT")
                .SumAsync(ct => ct.Amount);

            var bankSales = await _context.BankTransactions
                .Where(ct => ct.TransactionDate.Date == today && ct.BranchID == branchId && ct.TransactionType == "Thu" && ct.SourceType == "POS_BANK_PAYMENT")
                .SumAsync(ct => ct.Amount);

            // 4️⃣ Tiền thu từ phiếu trong ngày
            var cashReceipts = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == today && ct.BranchID == branchId && ct.TransactionType == "Thu" && ct.SourceType == "CASH_HANDOVER")
                .SumAsync(ct => ct.Amount);

            // 5️⃣ Tiền hoàn hàng trong ngày
            var cashRefunds = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == today && ct.BranchID == branchId && ct.TransactionType == "Chi" && ct.SourceType == "REFUND_CASH")
                .SumAsync(ct => ct.Amount);

            // 6️⃣ Tiền chi từ phiếu trong ngày
            var cashExpenses = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == today && ct.BranchID == branchId && ct.TransactionType == "Chi" && ct.SourceType == "EXPENSE_PAYOUT")
                .SumAsync(ct => ct.Amount);

            //tỏng thu
            decimal cashThu = (cashSales + cashReceipts);
            //tổng chi
            decimal cashChi = (cashRefunds + cashExpenses);
            //tồn quỹ đầu ca
            // 9️⃣ **Tính tồn quỹ đầu ca (tồn quỹ cuối ngày hôm trước)**
            var yesterdayCashSales = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == yesterday && ct.BranchID == branchId && ct.TransactionType == "Thu" && ct.SourceType == "POS_CASH_PAYMENT")
                .SumAsync(ct => ct.Amount);

            var yesterdayCashReceipts = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == yesterday && ct.BranchID == branchId && ct.TransactionType == "Thu" && ct.SourceType == "CASH_HANDOVER")
                .SumAsync(ct => ct.Amount);

            var yesterdayCashRefunds = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == yesterday && ct.BranchID == branchId && ct.TransactionType == "Chi" && ct.SourceType == "REFUND_CASH")
                .SumAsync(ct => ct.Amount);

            var yesterdayCashExpenses = await _context.CashTransactions
                .Where(ct => ct.TransactionDate.Date == yesterday && ct.BranchID == branchId && ct.TransactionType == "Chi" && ct.SourceType == "EXPENSE_PAYOUT")
                .SumAsync(ct => ct.Amount);

            decimal openingCashBalance = (yesterdayCashSales + yesterdayCashReceipts) - (yesterdayCashRefunds + yesterdayCashExpenses);
            //tồn quỹ
            decimal cashBalance = (openingCashBalance+cashSales + cashReceipts) - (cashRefunds + cashExpenses);

            return Ok(new
            {
                employeeName = employee.FullName,
                employeeID=employee.EmployeeId,
                branchId = branchId,
                currentDate = today.ToString("yyyy-MM-dd"),
                cashSales = cashSales,
                cashReceipts = cashReceipts,
                cashRefunds = cashRefunds,
                cashExpenses = cashExpenses,
                bankSales=bankSales,
                cashThu=cashThu,
                cashChi=cashChi,
                cashBalance = cashBalance,
                openingCashBalance= openingCashBalance
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
        }
    }

}
