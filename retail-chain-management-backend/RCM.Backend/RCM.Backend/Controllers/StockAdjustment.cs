using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

namespace RetailChain.Controllers
{
    [Route("api/stockadjustments")]
    [ApiController]
    public class StockAdjustmentsController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public StockAdjustmentsController(RetailChainContext context)
        {
            _context = context;
        }

        [HttpPost("CreateStockAdjustment")]
        public async Task<IActionResult> CreateStockAdjustment([FromBody] StockAdjustmentCreateDto dto)
        {
            if(dto.Items == null || dto.Items.Count == 0)
                return BadRequest("No items provided for adjustment.");

            var adjustment = new StockAdjustment
            {
                WarehouseId = dto.WarehouseId,
                AuditorId = dto.AuditorId,
                AdjustmentDate = DateTime.Now,
                Notes = dto.Notes
            };

            _context.StockAdjustments.Add(adjustment);
            await _context.SaveChangesAsync();

            foreach (var item in dto.Items)
            {
                var stockLevel = await _context.StockLevels
                    .FirstOrDefaultAsync(x => x.WarehouseId == dto.WarehouseId && x.ProductId == item.ProductId);

                if (stockLevel == null)
                    return NotFound($"Stock level not found for ProductId: {item.ProductId}");

                var detail = new StockAdjustmentDetail
                {
                    AdjustmentId = adjustment.StockAdjustmentsId,
                    ProductId = item.ProductId,
                    PreviousQuantity = stockLevel.Quantity,
                    AdjustedQuantity = item.AdjustedQuantity,
                    Reason = item.Reason
                };

                stockLevel.Quantity = item.AdjustedQuantity;

                _context.StockAdjustmentDetails.Add(detail);
            }

            await _context.SaveChangesAsync();

            return Ok(new { adjustmentId = adjustment.StockAdjustmentsId });
        }
    }

    // DTO Classes
    public class StockAdjustmentCreateDto
    {
        public int WarehouseId { get; set; }
        public int AuditorId { get; set; } // ID người điều chỉnh
        public string Notes { get; set; }
        public List<StockAdjustmentItemDto> Items { get; set; }
    }

    public class StockAdjustmentItemDto
    {
        public int ProductId { get; set; }
        public int AdjustedQuantity { get; set; }
        public string Reason { get; set; }
    }
}
