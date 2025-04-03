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
    var auditRecord = _context.StockAuditRecords.FirstOrDefault(a => a.StockAuditRecordsId == auditId);
    if (auditRecord == null)
        return NotFound();

    // Lấy tất cả điều chỉnh để xử lý logic so sánh ngày trên client
    var adjustmentRecords = _context.StockAdjustments
        .Where(sa => sa.WarehouseId == auditRecord.WarehouseId)
        .ToList();

    var adjustmentRecord = adjustmentRecords.FirstOrDefault(sa =>
        sa.AdjustmentDate.HasValue &&
        sa.AdjustmentDate.Value.Date == auditRecord.AuditDate.GetValueOrDefault().Date);

    var auditDetails = from sad in _context.StockAuditDetails
                       where sad.AuditId == auditId
                       join adjDetail in _context.StockAdjustmentDetails
                           .Where(ad => adjustmentRecord != null && ad.AdjustmentId == adjustmentRecord.StockAdjustmentsId)
                           on sad.ProductId equals adjDetail.ProductId into adjGroup
                       from adjDetail in adjGroup.DefaultIfEmpty()
                       select new
                       {
                           sad.StockAuditDetailsId,
                           sad.ProductId,
                           sad.RecordedQuantity,
                           PreviousQuantity = adjDetail != null ? adjDetail.PreviousQuantity : sad.RecordedQuantity,
                           AdjustedQuantity = adjDetail != null ? adjDetail.AdjustedQuantity : sad.RecordedQuantity,
                           Reason = adjDetail != null ? adjDetail.Reason : "Không có ghi chú"
                       };

    return Ok(auditDetails.ToList());
}

    }
}
