using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Data;


[Route("api/[controller]")]
[ApiController]
public class CashBookStaff : ControllerBase
{
    private readonly RetailChainContext _context;

    
    private readonly IConfiguration _configuration;

    public CashBookStaff(RetailChainContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("cashbook-list")]
    public async Task<IActionResult> GetCashBookSummary()
    {
        try
        {
            // Lấy AccountID từ Token
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            int employeeId = int.Parse(accountIdClaim);

            if (employeeId == null)
            {
                return Unauthorized("Không thể xác thực EmployeeID từ Token.");
            }

            using (var connection = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
            {
                var result = await connection.QueryAsync<CashTransaction>(
                    "dbo.GetCashBookToday",
                    new { EmployeeID = employeeId },
                    commandType: CommandType.StoredProcedure
                );

                return Ok(result);
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi server: {ex.Message}");
        }
    }

   


    [HttpGet("cashbook-staff-summary")]
    [Authorize]
    public async Task<IActionResult> GetCashBookStaffSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? transactionType)
    {
        try
        {
            // Lấy AccountID từ Token
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            int accountId = int.Parse(accountIdClaim);

            // Lấy thông tin nhân viên & chi nhánh
            var employee = await _context.Employees
                .Where(e => e.AccountId == accountId)
                .Select(e => new { e.FullName, e.BranchId })
                .FirstOrDefaultAsync();

            if (employee == null || employee.BranchId == null)
                return NotFound(new { message = "Không tìm thấy thông tin nhân viên hoặc chi nhánh." });
            var today = DateTime.Today;
            int branchId = employee.BranchId.Value;
            var query = _context.CashTransactions.Where(ct => ct.BranchID == branchId);

         
            query = query.Where(ct => ct.TransactionDate == today);

            // Áp dụng bộ lọc loại giao dịch (Thu, Chi, hoặc Tất cả)
            if (!string.IsNullOrEmpty(transactionType) && transactionType != "Tất cả")
                query = query.Where(ct => ct.TransactionType == transactionType);

            // Tính tổng thu, tổng chi, số dư quỹ
            decimal totalRevenue = await query.Where(ct => ct.TransactionType == "Thu").SumAsync(ct => ct.Amount);
            decimal totalExpense = await query.Where(ct => ct.TransactionType == "Chi").SumAsync(ct => ct.Amount);
            

            return Ok(new
            {
                employeeName = employee.FullName,
                branchId = branchId,
                totalRevenue = totalRevenue,
                totalExpense = totalExpense,
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ Lỗi API cashbook-staff-summary: " + ex.Message);
            return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
        }
    }
    [HttpGet("cashbook-staff-history")]
    [Authorize]
    public async Task<IActionResult> GetCashBookStaffHistory([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] string? transactionType, [FromQuery] string? search)
    {
        try
        {
            // Lấy AccountID từ Token
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized(new { message = "Không thể xác thực người dùng." });

            int accountId = int.Parse(accountIdClaim);

            // Lấy thông tin nhân viên & chi nhánh
            var employee = await _context.Employees
                .Where(e => e.AccountId == accountId)
                .Select(e => new { e.FullName, e.BranchId })
                .FirstOrDefaultAsync();

            if (employee == null || employee.BranchId == null)
                return NotFound(new { message = "Không tìm thấy thông tin nhân viên hoặc chi nhánh." });

            int branchId = employee.BranchId.Value;
            var query = _context.CashTransactions.Where(ct => ct.BranchID == branchId);

            // 🔹 Nếu không có ngày, mặc định lấy 7 ngày gần nhất
            if (!startDate.HasValue && !endDate.HasValue)
            {
                startDate = DateTime.Today;
                endDate = DateTime.UtcNow;
            }
            else if (!startDate.HasValue) // Nếu chỉ chọn endDate, mặc định startDate là 7 ngày trước
            {
                startDate = endDate.Value.AddDays(-7);
            }
            else if (!endDate.HasValue) // Nếu chỉ chọn startDate, mặc định endDate là hôm nay
            {
                endDate = DateTime.UtcNow;
            }

            // 🔹 Lọc theo khoảng ngày
            query = query.Where(ct => ct.TransactionDate >= startDate.Value && ct.TransactionDate <= endDate.Value);

            // Áp dụng bộ lọc loại giao dịch (Thu, Chi, hoặc Tất cả)
            if (!string.IsNullOrEmpty(transactionType) && transactionType != "Tất cả")
                query = query.Where(ct => ct.TransactionType == transactionType);

            // Áp dụng tìm kiếm theo mã giao dịch
            if (!string.IsNullOrEmpty(search))
                query = query.Where(ct => ct.TransactionCode.Contains(search));

            // Lấy danh sách giao dịch
            var transactions = await query
                .OrderByDescending(ct => ct.TransactionDate)
                .Select(ct => new
                {
                    ct.TransactionId,
                    ct.TransactionCode,
                    ct.TransactionDate,
                    ct.TransactionType,
                    ct.Amount,
                    ct.SourceType
                })
                .ToListAsync();

            return Ok(new
            {
                employeeName = employee.FullName,
                branchId = branchId,
                transactions = transactions
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ Lỗi API cashbook-staff-history: " + ex.Message);
            return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
        }
    }

}
