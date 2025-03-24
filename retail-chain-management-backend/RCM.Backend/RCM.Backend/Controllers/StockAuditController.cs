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
public async Task<IActionResult> GetAuditDetails(int auditId)
{
    var details = await _context.StockAuditDetails
        .Where(d => d.AuditId == auditId)
        .Select(d => new
        {
            d.StockAuditDetailsId,
            d.AuditId,
            d.ProductId,
            d.RecordedQuantity
        })
        .ToListAsync();

    return Ok(details);
}

    }
}
