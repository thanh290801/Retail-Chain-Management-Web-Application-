using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[Route("api/warehouses")]
[ApiController]
public class WarehouseController : ControllerBase
{
    private readonly RetailChainContext _context;

    public WarehouseController(RetailChainContext context)
    {
        _context = context;
    }

    // ✅ API lấy danh sách tất cả các kho
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAllWarehouses()
    {
        var warehouses = await _context.Warehouses
            .Select(w => new
            {
                w.WarehousesId,
                w.Name
            })
            .ToListAsync();

        return Ok(warehouses);
    }

    // ✅ API lấy tất cả sản phẩm trong một kho cụ thể
    [HttpGet("{warehouseId}/products")]
    public async Task<ActionResult<IEnumerable<object>>> GetProductsByWarehouse(int warehouseId)
    {
        var productsInStock = await _context.StockLevels
            .Where(s => s.WarehouseId == warehouseId)
            .Join(_context.Products,
                stock => stock.ProductId,
                product => product.ProductsId,
                (stock, product) => new
                {
                    product.ProductsId,
                    product.Name,
                    product.Barcode,
                    stock.Quantity,
                    stock.MinQuantity,
                    stock.PurchasePrice,
                    stock.WholesalePrice,
                    stock.RetailPrice,
                    product.Unit,
                    product.ImageUrl,
                    product.Category
                })
            .ToListAsync();

        if (!productsInStock.Any())
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm trong kho này." });
        }

        return Ok(productsInStock);
    }
}
