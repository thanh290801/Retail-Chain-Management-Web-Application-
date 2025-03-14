using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using RCM.Backend.Models;

[Route("api/[controller]")]
[ApiController]
public class CashHandoverController : ControllerBase
{
    private readonly RetailChainContext _context;

    public CashHandoverController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CreateHandover([FromBody] CashHandover handover)
    {
        if (handover == null)
            return BadRequest("Dữ liệu không hợp lệ");

        // Tạo phiếu bàn giao tiền mặt
        var newHandover = new CashHandover
        {
            HandoverID=handover.HandoverID,
            TransactionDate = handover.TransactionDate,
            EmployeeID = handover.EmployeeID,
            ReceiverID = handover.ReceiverID,
            BranchID = handover.BranchID,
            Amount = handover.Amount,
            TransactionType = handover.TransactionType,
            Description = handover.Description,
            CreatedBy = handover.CreatedBy,
            CreatedAt = DateTime.UtcNow,
            PersonName = handover.PersonName,
            Note = handover.Note
        };

        _context.CashHandovers.Add(newHandover);
        await _context.SaveChangesAsync();

        // **Lưu giao dịch vào Cash_Transactions**
        var transaction = new CashTransaction
        {
            FundId = 1, // Giả định quỹ tiền mặt mặc định là 1
            TransactionCode = $"CASH_{newHandover.HandoverID}",
            TransactionDate = newHandover.TransactionDate,
            TransactionType = newHandover.TransactionType,
            Amount = newHandover.Amount,
            SourceType = "CASH_HANDOVER",
            EmployeeId = newHandover.EmployeeID,
            BranchID = newHandover.BranchID,
            HandoverID = newHandover.HandoverID // Liên kết với phiếu bàn giao
        };

        _context.CashTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        // Trả về response ngắn gọn
        var response = new
        {
            newHandover.HandoverID,
            newHandover.TransactionDate,
            newHandover.Amount,
            newHandover.TransactionType,
            newHandover.Description,
            newHandover.CreatedBy,
            newHandover.EmployeeID,
            newHandover.ReceiverID,
            newHandover.BranchID,
            newHandover.PersonName,
            newHandover.Note,
        };

        return Ok(response);
    }
}
