using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers
{
    [Route("api/stock-audits")]
    [ApiController]
    public class StockAuditController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public StockAuditController(RetailChainContext context)
        {
            _context = context;
        }

        [HttpGet("history")]
public async Task<IActionResult> GetStockAuditHistory()
{
    var records = await _context.StockAuditRecords
        .OrderByDescending(r => r.AuditDate)
        .Select(r => new
        {
            r.StockAuditRecordsId,
            r.WarehouseId,
            r.AuditorId,
            r.CoAuditorId,
            r.AuditDate
        })
        .ToListAsync();

    return Ok(records);
}
[HttpGet("details/{auditId}")]
public IActionResult GetStockAuditDetails(int auditId)
{
    var auditRecord = _context.StockAuditRecords
        .FirstOrDefault(a => a.StockAuditRecordsId == auditId);

    if (auditRecord == null)
        return NotFound(new { Message = "Không tìm thấy phiếu kiểm kho." });

    var auditDetails = _context.StockAuditDetails
        .Where(sad => sad.AuditId == auditId)
        .Select(sad => new
        {
            sad.StockAuditDetailsId,
            AuditId = sad.AuditId,
            ProductId = sad.ProductId,
            RecordedQuantity = sad.RecordedQuantity,
            StockQuantity = sad.StockQuantity,
            Reason = sad.Reason
        })
        .ToList();

    return Ok(auditDetails);
}

    }
}
