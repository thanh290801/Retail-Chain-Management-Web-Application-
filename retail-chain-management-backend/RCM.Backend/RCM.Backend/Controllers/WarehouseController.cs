using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using RCM.Backend.Models;

[Route("api/warehouse")]
[ApiController]
public class WarehouseController : ControllerBase
{
    private readonly RetailChainContext _context;

    public WarehouseController(RetailChainContext context)
    {
        _context = context;
    }

[HttpGet("{id}")]
public IActionResult GetWarehouseById(int id)
{
    var warehouse = _context.Warehouses
        .Where(w => w.WarehousesId == id)
        .Select(w => new { w.WarehousesId, w.Name })
        .FirstOrDefault();

    if (warehouse == null)
    {
        return NotFound(new { message = "Không tìm thấy kho!" });
    }

    return Ok(warehouse);
}

    // 📌 1. Lấy danh sách kho
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
    {
        return await _context.Warehouses.ToListAsync();
    }

    // 📌 2. Lấy danh sách sản phẩm có ở cả 2 kho (Kho nguồn & Kho đích)
    [HttpGet("available-products")]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableProducts(int sourceWarehouseId, int destinationWarehouseId)
    {
        var products = await _context.StockLevels
            .Where(s => s.WarehouseId == sourceWarehouseId)
            .Join(_context.StockLevels,
                source => source.ProductId,
                dest => dest.ProductId,
                (source, dest) => new { source, dest })
            .Where(pair => pair.dest.WarehouseId == destinationWarehouseId)
            .Select(pair => new
            {
                pair.source.ProductId,
                pair.source.Product.Name,
                pair.source.Product.Unit,
                pair.source.Quantity,
                pair.source.MinQuantity
            })
            .ToListAsync();

        return Ok(products);
    }

    // 📌 3. API Tạo Phiếu Điều Chuyển Kho
[HttpPost("transfer")]
public async Task<IActionResult> TransferStock([FromBody] WarehouseTransferRequest request)
{
    if (request == null)
        return BadRequest(new { message = "Dữ liệu gửi lên không hợp lệ." });

    if (request.Items == null || !request.Items.Any())
        return BadRequest(new { message = "Danh sách sản phẩm điều chuyển không hợp lệ." });

    if (request.SourceWarehouseId == request.DestinationWarehouseId)
        return BadRequest(new { message = "Kho nguồn và kho đích không thể giống nhau." });

    if (request.CreatedBy <= 0)
        return BadRequest(new { message = "Người tạo không hợp lệ." });

    // 🔹 Tạo phiếu điều chuyển
    var transfer = new WarehouseTransfer
    {
        FromWarehouseId = request.SourceWarehouseId,
        ToWarehouseId = request.DestinationWarehouseId,
        TransferDate = DateTime.UtcNow,
        CreatedBy = request.CreatedBy,
        Status = "Chưa chuyển"
    };

    _context.WarehouseTransfers.Add(transfer);
    await _context.SaveChangesAsync();

    // 🔹 Ghi chi tiết sản phẩm điều chuyển
    foreach (var item in request.Items)
    {
        _context.WarehouseTransferDetails.Add(new WarehouseTransferDetail
        {
            TransferId = transfer.TransferId,
            ProductId = item.ProductId,
            Quantity = item.Quantity
        });
    }

    await _context.SaveChangesAsync();

    // ✅ GỬI THÔNG BÁO CHO NHÂN VIÊN KHO NGUỒN (FromWarehouseId)
    var fromWarehouse = await _context.Warehouses
        .FirstOrDefaultAsync(w => w.WarehousesId == request.SourceWarehouseId);

    var sourceEmployees = await _context.Employees
        .Where(e => e.BranchId == request.SourceWarehouseId && e.AccountId != null)
        .ToListAsync();

    foreach (var emp in sourceEmployees)
    {
        var notif = new Notification
        {
            Title = "Phiếu điều chuyển kho",
            Message = $"Có phiếu điều chuyển từ kho của bạn ({fromWarehouse?.Name ?? "Không xác định"}).",
            ReceiverAccountId = emp.AccountId.Value,
            CreatedAt = DateTime.Now,
            IsRead = false
        };
        _context.Notifications.Add(notif);
    }

    await _context.SaveChangesAsync();

    return Ok(new { message = "Phiếu điều chuyển đã được tạo thành công." });
}

  [HttpGet("{warehouseId}/products")]
public async Task<ActionResult<IEnumerable<object>>> GetProductsByWarehouse(int warehouseId)
{
    // Kiểm tra xem kho có tồn tại không
    var warehouseExists = await _context.Warehouses.AnyAsync(w => w.WarehousesId == warehouseId);
    if (!warehouseExists)
    {
        return NotFound(new { message = "Kho không tồn tại." });
    }

    // Lấy danh sách sản phẩm có trong kho và bao gồm trường status
    var productsInStock = await _context.StockLevels
        .Where(s => s.WarehouseId == warehouseId)
        .Join(_context.Products,
            stock => stock.ProductId,
            product => product.ProductsId,
            (stock, product) => new
            {
                product.ProductsId,
                product.Name,
                product.Unit,
                stock.Quantity,
                stock.MinQuantity,
                stock.PurchasePrice,
                stock.WholesalePrice,
                stock.RetailPrice,
                stock.Status // Trả về thêm trường status
            })
        .OrderBy(p => p.Name)
        .ToListAsync();

    // Kiểm tra nếu kho không có sản phẩm
    if (!productsInStock.Any())
    {
        return NotFound(new { message = "Kho này không có sản phẩm nào." });
    }

    return Ok(productsInStock);
}

[HttpPut("{warehouseId}/toggle-product-status/{productId}")]
        public async Task<IActionResult> ToggleProductStatus(int warehouseId, int productId, [FromBody] ToggleStatusDto dto)
        {
            var stockLevel = await _context.StockLevels
                .FirstOrDefaultAsync(sl => sl.WarehouseId == warehouseId && sl.ProductId == productId);

            if (stockLevel == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm trong kho." });
            }

            stockLevel.Status = dto.Status;
            await _context.SaveChangesAsync();

            var statusMessage = dto.Status ? "Sản phẩm đã được bật lại." : "Sản phẩm đã được vô hiệu hóa.";
            return Ok(new { message = statusMessage });
        }

        // POST: api/Warehouses
[HttpPost]
public async Task<IActionResult> CreateWarehouse([FromBody] WarehouseCreateDto dto)
{
    if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Address) || dto.Capacity <= 0)
        return BadRequest("Thông tin không hợp lệ.");

    var existing = await _context.Warehouses.AnyAsync(w => w.Name == dto.Name.Trim());
    if (existing)
        return Conflict(new { message = "Tên kho đã tồn tại." });

    var warehouse = new Warehouse
    {
        Name = dto.Name.Trim(),
        Address = dto.Address.Trim(),
        Capacity = dto.Capacity
    };

    _context.Warehouses.Add(warehouse);
    await _context.SaveChangesAsync();

    return Ok(new { message = "Tạo kho hàng thành công." });
}

// GET: api/Warehouses/check-name?name=Chi%20Nhanh%201
[HttpGet("check-name")]
public async Task<IActionResult> CheckWarehouseName([FromQuery] string name)
{
    if (string.IsNullOrWhiteSpace(name))
        return BadRequest("Thiếu tên kho.");

    var exists = await _context.Warehouses.AnyAsync(w => w.Name == name.Trim());
    return Ok(new { exists });
}

public class WarehouseCreateDto
{
    public string Name { get; set; }
    public string Address { get; set; }
    public int Capacity { get; set; } // tính theo m3
}

}

// 📌 4. Model Request (Không cần chỉnh Model gốc)
public class WarehouseTransferRequest
{
    public int SourceWarehouseId { get; set; }
    public int DestinationWarehouseId { get; set; }
    public int CreatedBy { get; set; }  // 🔹 Thêm dòng này
    public List<TransferItem> Items { get; set; }
}

public class TransferItem
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
 public class ToggleStatusDto
    {
        public bool Status { get; set; }
    }
