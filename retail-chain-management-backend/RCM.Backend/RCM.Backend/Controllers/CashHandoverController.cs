using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using RCM.Backend.Models;
using System.Security.Claims;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

[Route("api/[controller]")]
[ApiController]
public class CashHandoverController : ControllerBase
{
    private readonly IConfiguration _configuration;

    private readonly RetailChainContext _context;
    public CashHandoverController(IConfiguration configuration, RetailChainContext context)
    {
        _configuration = configuration;
        _context = context;
    }
    [HttpGet("cashbook")]
    public async Task<IActionResult> GetTodayCashbook()
    {
        // Lấy thông tin nhân viên đăng nhập từ token
        var accountIdClaim = User.FindFirst("AccountId")?.Value;
        var branchIdClaim = User.FindFirst("BranchId")?.Value;

        if (!int.TryParse(accountIdClaim, out int empId))
            return Unauthorized("Invalid user");

        if (!int.TryParse(branchIdClaim, out int branchId) || branchId <= 0)
            return BadRequest("Invalid branch ID");

        DateTime today = DateTime.Today;
        DateTime tomorrow = today.AddDays(1);

        // Truy vấn tất cả giao dịch tiền mặt hôm nay
        var cashbookTransactions = await _context.Transactions
            .Where(t => t.TransactionDate >= today && t.TransactionDate < tomorrow && t.BranchId == branchId)
            .Where(t => t.TransactionType == "POS_CASH_PAYMENT"
                        || t.TransactionType == "CASH_HANDOVER"
                        || t.TransactionType == "CASH_EXPENSE"
                        || t.TransactionType == "CASH_REFUND")
            .OrderByDescending(t => t.TransactionDate)
            .Select(t => new
            {
                TransactionId = t.TransactionId,
                TransactionDate = t.TransactionDate,
                TransactionCode = t.TransactionCode,
                TransactionType = t.TransactionType,
                Amount = t.Amount,
                Description = t.Description,
                PerformedBy = t.PerformedBy,
                PaymentMethod = t.PaymentMethod
            })
            .ToListAsync();

        if (!cashbookTransactions.Any())
            return NotFound("Không có giao dịch tiền mặt nào hôm nay.");

        return Ok(new
        {
            BranchId = branchId,
            Transactions = cashbookTransactions
        });
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateCashHandover([FromBody] CashHandoverRequest request)
    {
        if (request == null || request.Amount <= 0)
            return BadRequest("Dữ liệu không hợp lệ");

        try
        {
            using (SqlConnection conn = new SqlConnection(_configuration.GetConnectionString("DefaultConnection")))
            {
                await conn.OpenAsync();
                using (SqlTransaction transaction = conn.BeginTransaction())
                {
                    try
                    {
                        int handoverId;

                        // 1️⃣ Lưu vào bảng Cash_Handover
                        string insertHandoverQuery = @"
                            INSERT INTO Cash_Handover 
                            (TransactionDate, EmployeeID, ReceiverID, BranchID, Amount, TransactionType, Description, CreatedBy, PersonName)
                            OUTPUT INSERTED.HandoverID
                            VALUES (GETDATE(), @EmployeeID, @ReceiverID, @BranchID, @Amount, @TransactionType, @Description, @CreatedBy, @PersonName)";

                        using (SqlCommand cmd = new SqlCommand(insertHandoverQuery, conn, transaction))
                        {
                            cmd.Parameters.AddWithValue("@EmployeeID", request.EmployeeId);
                            cmd.Parameters.AddWithValue("@ReceiverID", request.ReceiverId ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@BranchID", request.BranchId);
                            cmd.Parameters.AddWithValue("@Amount", request.Amount);
                            cmd.Parameters.AddWithValue("@TransactionType", request.TransactionType);
                            cmd.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);
                            cmd.Parameters.AddWithValue("@CreatedBy", request.CreatedBy);
                            cmd.Parameters.AddWithValue("@PersonName", request.PersonName ?? (object)DBNull.Value);

                            handoverId = (int)await cmd.ExecuteScalarAsync();
                        }

                        // 2️⃣ Lưu vào bảng Transactions
                        string insertTransactionQuery = @"
                            INSERT INTO Transactions 
                            (transaction_code, transaction_type, payment_method, amount, transaction_date, employee_id, branch_id, performed_by, handover_id, description)
                            VALUES (@TransactionCode, @TransactionType, 'Cash', @Amount, GETDATE(), @EmployeeID, @BranchID, @CreatedBy, @HandoverID, @Description)";

                        using (SqlCommand cmd = new SqlCommand(insertTransactionQuery, conn, transaction))
                        {
                            cmd.Parameters.AddWithValue("@TransactionCode", request.TransactionCode);
                            cmd.Parameters.AddWithValue("@TransactionType", request.TransactionType);
                            cmd.Parameters.AddWithValue("@Amount", request.Amount);
                            cmd.Parameters.AddWithValue("@EmployeeID", request.EmployeeId);
                            cmd.Parameters.AddWithValue("@BranchID", request.BranchId);
                            cmd.Parameters.AddWithValue("@CreatedBy", request.CreatedBy);
                            cmd.Parameters.AddWithValue("@HandoverID", handoverId);
                            cmd.Parameters.AddWithValue("@Description", request.Description ?? (object)DBNull.Value);

                            await cmd.ExecuteNonQueryAsync();
                        }

                        // ✅ Commit transaction
                        transaction.Commit();
                        return Ok(new { Message = "Phiếu bàn giao thành công!", HandoverID = handoverId });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        return StatusCode(500, new { Message = "Lỗi khi tạo phiếu bàn giao", Error = ex.Message });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi kết nối cơ sở dữ liệu", Error = ex.Message });
        }
    }
}
