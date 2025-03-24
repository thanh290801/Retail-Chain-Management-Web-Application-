using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers
{
    [ApiController]
    [Route("api/warehouse-transfers")]
    public class WarehouseTransferController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public WarehouseTransferController(RetailChainContext context)
        {
            _context = context;
        }

        // ✅ API 1: Danh sách điều chuyển (trả về ID kho)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseTransferDto>>> GetAllTransfers()
        {
            var transfers = await _context.WarehouseTransfers
                .OrderByDescending(w => w.TransferDate)
                .Select(w => new WarehouseTransferDto
                {
                    TransferId = w.TransferId,
                    FromWarehouseId = w.FromWarehouseId,
                    ToWarehouseId = w.ToWarehouseId,
                    TransferDate = w.TransferDate,
                    Status = w.Status
                })
                .ToListAsync();

            return Ok(transfers);
        }

        // ✅ API 2: Chi tiết điều chuyển (trả về ID kho)
        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseTransferDetailDto>> GetTransferDetail(int id)
        {
            var transfer = await _context.WarehouseTransfers
                .FirstOrDefaultAsync(w => w.TransferId == id);

            if (transfer == null)
                return NotFound();

            var details = await _context.WarehouseTransferDetails
                .Where(d => d.TransferId == id)
                .Include(d => d.Product)
                .Select(d => new ProductTransferItemDto
                {
                    ProductId = d.ProductId,
                    ProductName = d.Product.Name,
                    Quantity = d.Quantity
                })
                .ToListAsync();

            var result = new WarehouseTransferDetailDto
            {
                TransferId = transfer.TransferId,
                FromWarehouseId = transfer.FromWarehouseId,
                ToWarehouseId = transfer.ToWarehouseId,
                TransferDate = transfer.TransferDate,
                Status = transfer.Status,
                Notes = transfer.Notes,
                Products = details
            };

            return Ok(result);
        }
    }

    // DTOs
    public class WarehouseTransferDto
    {
        public int TransferId { get; set; }
        public int FromWarehouseId { get; set; }
        public int ToWarehouseId { get; set; }
        public DateTime? TransferDate { get; set; }
        public string? Status { get; set; }
    }

    public class WarehouseTransferDetailDto
    {
        public int TransferId { get; set; }
        public int FromWarehouseId { get; set; }
        public int ToWarehouseId { get; set; }
        public DateTime? TransferDate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public List<ProductTransferItemDto> Products { get; set; } = new();
    }

    public class ProductTransferItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
