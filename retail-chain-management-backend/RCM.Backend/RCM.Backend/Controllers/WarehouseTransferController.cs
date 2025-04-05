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

        // ✅ API 1: Danh sách điều chuyển theo kho
        [HttpGet("for-warehouse/{warehouseId}")]
        public async Task<IActionResult> GetTransfersForWarehouse(int warehouseId)
        {
            var transfers = await _context.WarehouseTransfers
                .Include(t => t.FromWarehouse)
                .Include(t => t.ToWarehouse)
                .Include(t => t.WarehouseTransferDetails)
                    .ThenInclude(d => d.Product)
                .Where(t =>
                    (t.FromWarehouseId == warehouseId && t.Status == "Chưa chuyển") ||
                    (t.ToWarehouseId == warehouseId && t.Status == "Đã chuyển hàng"))
                .Select(t => new WarehouseTransferDto
                {
                    TransferId = t.TransferId,
                    Status = t.Status,
                    TransferDate = t.TransferDate,
                    FromWarehouse = new WarehouseBasicDto
                    {
                        WarehouseId = t.FromWarehouse.WarehousesId,
                        Name = t.FromWarehouse.Name
                    },
                    ToWarehouse = new WarehouseBasicDto
                    {
                        WarehouseId = t.ToWarehouse.WarehousesId,
                        Name = t.ToWarehouse.Name
                    },
                    Products = t.WarehouseTransferDetails.Select(d => new ProductTransferItemDto
                    {
                        ProductId = d.ProductId,
                        ProductName = d.Product.Name,
                        Quantity = d.Quantity
                    }).ToList()
                })
                .ToListAsync();

            return Ok(transfers);
        }

        // ✅ API 2: Chi tiết điều chuyển theo ID
        [HttpGet("detail/{id}")]
        public async Task<IActionResult> GetTransferDetail(int id)
        {
            var transfer = await _context.WarehouseTransfers
                .Include(t => t.FromWarehouse)
                .Include(t => t.ToWarehouse)
                .Include(t => t.WarehouseTransferDetails)
                    .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(t => t.TransferId == id);

            if (transfer == null)
                return NotFound();

            var result = new WarehouseTransferDto
            {
                TransferId = transfer.TransferId,
                Status = transfer.Status,
                TransferDate = transfer.TransferDate,
                FromWarehouse = new WarehouseBasicDto
                {
                    WarehouseId = transfer.FromWarehouseId,
                    Name = transfer.FromWarehouse?.Name
                },
                ToWarehouse = new WarehouseBasicDto
                {
                    WarehouseId = transfer.ToWarehouseId,
                    Name = transfer.ToWarehouse?.Name
                },
                Products = transfer.WarehouseTransferDetails.Select(d => new ProductTransferItemDto
                {
                    ProductId = d.ProductId,
                    ProductName = d.Product.Name,
                    Quantity = d.Quantity
                }).ToList()
            };

            return Ok(result);
        }

       // ✅ API 3: Xác nhận chuyển hàng
[HttpPost("confirm-transfer")]
public async Task<IActionResult> ConfirmTransfer([FromBody] WarehouseTransferConfirmDto dto)
{
    var transfer = await _context.WarehouseTransfers
        .Include(t => t.WarehouseTransferDetails)
        .FirstOrDefaultAsync(t => t.TransferId == dto.TransferId && t.FromWarehouseId == dto.EmployeeWarehouseId);

    if (transfer == null || transfer.Status != "Chưa chuyển")
        return BadRequest("Không tìm thấy đơn hoặc trạng thái không phù hợp.");

    transfer.Status = "Đã chuyển hàng";

    foreach (var detail in transfer.WarehouseTransferDetails)
    {
        var stock = await _context.StockLevels
            .FirstOrDefaultAsync(s => s.WarehouseId == transfer.FromWarehouseId && s.ProductId == detail.ProductId);

        if (stock == null || stock.Quantity < detail.Quantity)
            return BadRequest($"Không đủ tồn kho sản phẩm {detail.ProductId}.");

        stock.Quantity -= detail.Quantity;
    }

    await _context.SaveChangesAsync();

    // ✅ Gửi thông báo cho nhân viên kho nhận
    var receivingEmployees = await _context.Employees
        .Where(e => e.BranchId == transfer.ToWarehouseId && e.AccountId != null)
        .ToListAsync();

    foreach (var emp in receivingEmployees)
    {
        _context.Notifications.Add(new Notification
        {
            Title = "Thông báo điều chuyển kho",
            Message = "Có đơn điều chuyển hàng đến kho của bạn.",
            ReceiverAccountId = emp.AccountId.Value,
            CreatedAt = DateTime.Now,
            IsRead = false
        });
    }

    await _context.SaveChangesAsync();

    return Ok("Xác nhận chuyển hàng thành công.");
}

// ✅ API 4: Xác nhận nhận hàng
[HttpPost("confirm-receive")]
public async Task<IActionResult> ConfirmReceive([FromBody] WarehouseTransferConfirmDto dto)
{
    var transfer = await _context.WarehouseTransfers
        .Include(t => t.WarehouseTransferDetails)
        .FirstOrDefaultAsync(t => t.TransferId == dto.TransferId && t.ToWarehouseId == dto.EmployeeWarehouseId);

    if (transfer == null || transfer.Status != "Đã chuyển hàng")
        return BadRequest("Không tìm thấy đơn hoặc trạng thái không phù hợp.");

    transfer.Status = "Hoàn tất";

    foreach (var detail in transfer.WarehouseTransferDetails)
    {
        var stock = await _context.StockLevels
            .FirstOrDefaultAsync(s => s.WarehouseId == transfer.ToWarehouseId && s.ProductId == detail.ProductId);

        if (stock == null)
        {
            stock = new StockLevel
            {
                WarehouseId = transfer.ToWarehouseId,
                ProductId = detail.ProductId,
                Quantity = 0
            };
            _context.StockLevels.Add(stock);
        }

        stock.Quantity += detail.Quantity;
    }

    await _context.SaveChangesAsync();

    // ✅ Gửi thông báo cho Chủ hệ thống
    var owner = await _context.Employees
        .Where(e => e.BranchId == null && e.AccountId != null)
        .Select(e => e.AccountId.Value)
        .FirstOrDefaultAsync();

    if (owner > 0)
    {
        _context.Notifications.Add(new Notification
        {
            Title = "Xác nhận điều chuyển",
            Message = $"Đơn điều chuyển #{transfer.TransferId} đã nhận hàng thành công.",
            ReceiverAccountId = owner,
            CreatedAt = DateTime.Now,
            IsRead = false
        });

        await _context.SaveChangesAsync();
    }

    return Ok("Xác nhận nhận hàng thành công.");
}

        [HttpGet("all")]
public async Task<IActionResult> GetAllTransfersForOwner()
{
    var transfers = await _context.WarehouseTransfers
        .Include(t => t.FromWarehouse)
        .Include(t => t.ToWarehouse)
        .OrderByDescending(t => t.TransferDate)
        .Select(t => new
        {
            TransferId = t.TransferId,
            TransferDate = t.TransferDate,
            Status = t.Status,
            FromWarehouse = new
            {
                t.FromWarehouse.WarehousesId,
                t.FromWarehouse.Name
            },
            ToWarehouse = new
            {
                t.ToWarehouse.WarehousesId,
                t.ToWarehouse.Name
            }
        })
        .ToListAsync();

    return Ok(transfers);
}

    }

    // ✅ DTOs
    public class WarehouseTransferDto
    {
        public int TransferId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? TransferDate { get; set; }
        public WarehouseBasicDto FromWarehouse { get; set; }
        public WarehouseBasicDto ToWarehouse { get; set; }
        public List<ProductTransferItemDto> Products { get; set; } = new();
    }

    public class WarehouseBasicDto
    {
        public int WarehouseId { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ProductTransferItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    public class WarehouseTransferConfirmDto
    {
        public int TransferId { get; set; }
        public int EmployeeWarehouseId { get; set; }
    }
}
