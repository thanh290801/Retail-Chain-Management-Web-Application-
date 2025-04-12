using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTOs;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers.Supplier_Order
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockLevelsController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public StockLevelsController(RetailChainContext context)
        {
            _context = context;
        }

        // API GET: Lấy toàn bộ sản phẩm có trong stock_levels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetStockLevels()
        {
            var products = await _context.StockLevels
                .Include(s => s.Product)
                .Select(s => new
                {
                    ProductId = s.ProductId,
                    ProductName = s.Product.Name,
                    Unit = s.Product.Unit, // 🟢 Đảm bảo lấy đơn vị từ bảng Products
                    StockQuantity = s.Quantity,
                    PurchasePrice = s.PurchasePrice,
                    RetailPrice = s.RetailPrice
                })
                .ToListAsync();

            return Ok(products);
        }

[HttpGet("GetAvailableProducts")]
public async Task<IActionResult> GetAvailableProducts(int supplierId, int warehouseId)
{
    // 🛑 Kiểm tra nếu supplierId không hợp lệ
    if (supplierId <= 0)
    {
        return BadRequest(new { message = "supplierId không hợp lệ!" });
    }

    // Truy vấn sản phẩm của nhà cung cấp và kiểm tra tồn kho cho warehouseId
    var products = await (from sp in _context.SupplierProducts
                          join p in _context.Products on sp.ProductId equals p.ProductsId
                          join s in _context.StockLevels on new { ProductId = p.ProductsId, WarehouseId = warehouseId } 
                              equals new { ProductId = s.ProductId, WarehouseId = s.WarehouseId } into stockLevels
                          from s in stockLevels.DefaultIfEmpty() // Nếu không có tồn kho thì sẽ trả về null
                          where sp.SupplierId == supplierId
                          select new
                          {
                              ProductId = p.ProductsId,
                              ProductName = p.Name,
                              Unit = p.Unit,
                              StockQuantity = s != null ? s.Quantity : 0, // Nếu có tồn kho thì lấy, không thì 0
                              PurchasePrice = s != null ? s.PurchasePrice : 0, // Giá nhập từ StockLevels nếu có
                              RetailPrice = s != null ? s.RetailPrice : 0 // Giá bán lẻ từ StockLevels nếu có
                          }).ToListAsync();

    // 🛑 Nếu không có sản phẩm nào, trả về NotFound
    if (products == null || !products.Any())
    {
        return NotFound(new { message = "Không có sản phẩm nào khả dụng cho nhà cung cấp này." });
    }

    return Ok(products);
}

        [HttpPut("UpdatePrice")]
        public async Task<IActionResult> UpdatePurchasePrice([FromBody] UpdatePurchasePriceDto request)
        {
            if (request == null || request.ProductId <= 0 || request.NewPrice <= 0)
            {
                return BadRequest("Dữ liệu không hợp lệ.");
            }

            var stockItem = await _context.StockLevels
                .FirstOrDefaultAsync(s => s.ProductId == request.ProductId);

            if (stockItem == null)
            {
                return NotFound("Không tìm thấy sản phẩm trong kho.");
            }

            // Cập nhật giá nhập
            stockItem.PurchasePrice = request.NewPrice;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Giá nhập đã được cập nhật thành công!", updatedPrice = stockItem.PurchasePrice });
        }
        [HttpPut("UpdatePurchasePrice")]
    public async Task<IActionResult> UpdatePrice([FromBody] UpdatePriceDto dto)
    {
        if (dto.WarehouseId <= 0 || dto.ProductId <= 0 || dto.NewPrice < 0)
            return BadRequest("Thông tin không hợp lệ.");

        var stockLevel = await _context.StockLevels
            .FirstOrDefaultAsync(s => s.WarehouseId == dto.WarehouseId && s.ProductId == dto.ProductId);

        if (stockLevel == null)
            return NotFound("Không tìm thấy sản phẩm trong kho này.");

        stockLevel.PurchasePrice = dto.NewPrice;

        try
        {
            await _context.SaveChangesAsync();
            return Ok("Đã cập nhật giá nhập thành công.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
        }
    }
    }
    public class UpdatePriceDto
{
    public int WarehouseId { get; set; }
    public int ProductId { get; set; }
    public decimal NewPrice { get; set; }
}

}
