using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace RCM.Backend.Controllers
{
    [Route("api/addtostock")]
    [ApiController]
    public class AddToStockController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public AddToStockController(RetailChainContext context)
        {
            _context = context;
        }

        // 📌 Lấy danh sách kho
        [HttpGet("warehouses")]
        public async Task<IActionResult> GetWarehouses()
        {
            var warehouses = await _context.Warehouses.ToListAsync();
            return Ok(warehouses);
        }

        // 📌 Lấy danh sách sản phẩm chưa có trong kho
        [HttpGet("{warehouseId}/products-not-in-stock")]
        public async Task<IActionResult> GetProductsNotInWarehouse(int warehouseId)
        {
            var productsNotInStock = await _context.Products
                .Where(p => !_context.StockLevels
                    .Any(sl => sl.ProductId == p.ProductsId && sl.WarehouseId == warehouseId))
                .Select(p => new
                {
                    p.ProductsId,
                    p.Name
                })
                .ToListAsync();

            return Ok(productsNotInStock);
        }

        // 📌 Thêm sản phẩm vào kho với thông tin giá và trạng thái
        [HttpPost("{warehouseId}/add-products")]
        public async Task<IActionResult> AddProductsToWarehouse(int warehouseId, [FromBody] List<AddProductToWarehouseDto> productDtos)
        {
            if (productDtos == null || !productDtos.Any())
            {
                return BadRequest("Không có sản phẩm nào được chọn để thêm vào kho.");
            }

            try
            {
                var newStockLevels = productDtos.Select(dto => new StockLevel
                {
                    ProductId = dto.ProductId,
                    WarehouseId = warehouseId,
                    Quantity = 0,
                    MinQuantity = 0,
                    PurchasePrice = dto.PurchasePrice,
                    WholesalePrice = dto.WholesalePrice,
                    RetailPrice = dto.RetailPrice,
                    Status = true
                }).ToList();

                await _context.StockLevels.AddRangeAsync(newStockLevels);
                await _context.SaveChangesAsync();

                return Ok("Sản phẩm đã được thêm vào kho thành công!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi thêm sản phẩm vào kho: {ex.Message}");
            }
        }
    }

    public class AddProductToWarehouseDto
    {
        public int ProductId { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal WholesalePrice { get; set; }
        public decimal RetailPrice { get; set; }
    }
}
