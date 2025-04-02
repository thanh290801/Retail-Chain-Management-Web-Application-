using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using RCM.Backend.Models; // Đảm bảo namespace đúng với Product
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly RetailChainContext _context;

    // Constructor đúng tên class
    public ProductsController(RetailChainContext context)
    {
        _context = context;
    }

    // API GET: /api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAllProducts()
    {
        var products = await _context.Products.ToListAsync();
        return Ok(products);
    }

    // API POST: /api/product (Thêm sản phẩm mới)
    [HttpPost]
    public async Task<ActionResult<Product>> AddProduct(Product product)
    {
        if (product == null)
        {
            return BadRequest("Dữ liệu sản phẩm không hợp lệ.");
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAllProducts), new { id = product.ProductsId }, product);
    }

    // API DELETE: /api/product/{id} (Xóa sản phẩm theo ID)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound("Không tìm thấy sản phẩm.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Sản phẩm đã được xóa thành công." });
    }

    // API PATCH: /api/products/{id}/toggle-status
    [HttpPatch("{id}/toggle-status")]
    public async Task<IActionResult> ToggleProductStatus(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm." });
        }

        product.IsEnabled = !product.IsEnabled;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Sản phẩm đã được {(product.IsEnabled.GetValueOrDefault() ? "bật" : "tắt")}.",
            product
        });
    }

    // API GET: /api/products/warehouse/{employeeId} (Lấy tất cả sản phẩm trong kho nhân viên làm việc)
    [HttpGet("warehouse/{employeeId}")]
    public async Task<ActionResult<IEnumerable<object>>> GetAllProductsByEmployeeWarehouse(int employeeId)
    {
        // Lấy WarehouseId của nhân viên
        var employee = await _context.Employees
            .Where(e => e.EmployeeId == employeeId)
            .Select(e => e.BranchId) // Lấy kho mà nhân viên đó làm việc
            .FirstOrDefaultAsync();

        if (employee == null)
        {
            return NotFound(new { message = "Không tìm thấy nhân viên hoặc nhân viên chưa được gán kho." });
        }

        int warehouseId = employee.Value; // ID kho nhân viên làm việc

        // Lấy danh sách sản phẩm đang enable trong kho đó
        var productsInStock = await _context.StockLevels
            .Where(s => s.WarehouseId == warehouseId && s.Status == true) // Chỉ lấy sản phẩm đang enable
            .Join(_context.Products,
                stock => stock.ProductId,
                product => product.ProductsId,
                (stock, product) => new
                {
                    product.ProductsId,
                    product.Name,
                    product.Barcode,
                    stock.Quantity,          // Tồn kho thực tế
                    stock.MinQuantity,       // Số lượng tồn kho tối thiểu
                    stock.PurchasePrice,     // Giá nhập
                    stock.WholesalePrice,    // Giá bán buôn
                    stock.RetailPrice,       // Giá bán lẻ
                    product.Unit,
                    product.ImageUrl,
                    product.Category
                })
            .ToListAsync();

        return Ok(productsInStock);
    }


    [HttpPost("update-price")]
    public async Task<IActionResult> UpdateProductPrice([FromBody] List<UpdatePriceRequest> priceUpdates)
    {
        if (priceUpdates == null || !priceUpdates.Any())
        {
            return BadRequest(new { message = "Không có dữ liệu cập nhật." });
        }

        var priceHistoryEntries = new List<ProductPriceHistory>();

        foreach (var update in priceUpdates)
        {
            var stock = await _context.StockLevels
                .FirstOrDefaultAsync(s => s.ProductId == update.ProductId && s.WarehouseId == update.WarehouseId);

            if (stock == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm {update.ProductId} trong kho {update.WarehouseId}." });
            }

            decimal? oldPrice = null;

            switch (update.PriceType)
            {
                case "NewPurchasePrice":
                    oldPrice = stock.PurchasePrice;
                    stock.PurchasePrice = update.NewPrice;
                    break;
                case "NewWholesalePrice":
                    oldPrice = stock.WholesalePrice;
                    stock.WholesalePrice = update.NewPrice;
                    break;
                case "NewRetailPrice":
                    oldPrice = stock.RetailPrice;
                    stock.RetailPrice = update.NewPrice;
                    break;
                default:
                    return BadRequest(new { message = "Loại giá không hợp lệ." });
            }

            // Chỉ lưu vào history nếu có sự thay đổi
            if (oldPrice != update.NewPrice)
            {
                priceHistoryEntries.Add(new ProductPriceHistory
                {
                    ProductId = update.ProductId,
                    PriceType = update.PriceType,
                    OldPrice = oldPrice.Value,
                    NewPrice = update.NewPrice,
                    ChangedBy = update.ChangedBy,
                    ChangeDate = DateTime.UtcNow,
                    WarehouseId = update.WarehouseId
                });
            }
        }

        if (priceHistoryEntries.Any())
        {
            _context.ProductPriceHistories.AddRange(priceHistoryEntries);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật giá thành công!" });


    }


    // Model DTO nhận từ frontend
    public class UpdatePriceRequest
    {
        public int ProductId { get; set; }
        public int WarehouseId { get; set; }
        public string PriceType { get; set; }
        public decimal NewPrice { get; set; }
        public int ChangedBy { get; set; }
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStockProducts([FromQuery] int? warehouseId, [FromQuery] int? supplierId)
    {
        // 1. Join StockLevels với Products
        var query = from stock in _context.StockLevels
                    join product in _context.Products on stock.ProductId equals product.ProductsId
                    where stock.Quantity < stock.MinQuantity
                    select new
                    {
                        product.ProductsId,
                        product.Name,
                        product.Unit,
                        stock.MinQuantity,
                        stock.Quantity,
                        stock.WarehouseId,
                        stock.PurchasePrice // ✅ lấy giá nhập
                    };

        // 2. Lọc theo warehouseId (BranchId từ frontend)
        if (warehouseId.HasValue && warehouseId.Value > 0)
        {
            query = query.Where(p => p.WarehouseId == warehouseId.Value);
        }

        // 3. Nếu lọc theo nhà cung cấp
        if (supplierId.HasValue)
        {
            var productIds = await _context.SupplierProducts
                .Where(sp => sp.SupplierId == supplierId.Value)
                .Select(sp => sp.ProductId)
                .ToListAsync();

            query = query.Where(p => productIds.Contains(p.ProductsId));
        }

        // 4. Trả kết quả
        var result = await query
            .Select(p => new
            {
                p.ProductsId,
                p.Name,
                p.Unit,
                p.MinQuantity,
                p.Quantity,
                p.PurchasePrice, // ✅ đưa vào kết quả trả về
                p.WarehouseId,
                SupplierIds = _context.SupplierProducts
                    .Where(sp => sp.ProductId == p.ProductsId)
                    .Select(sp => sp.SupplierId)
                    .ToList()
            })
            .ToListAsync();

        return Ok(result);
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        return Ok(product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductsDTO product)
    {
        var existing = await _context.Products.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = product.Name;
        existing.Barcode = product.Barcode;
        existing.Unit = product.Unit;
        existing.Weight = product.Weight;
        existing.Volume = product.Volume;
        existing.ImageUrl = product.ImageUrl;
        existing.Category = product.Category;


        await _context.SaveChangesAsync();
        return NoContent();
    }
    // API GET: /api/products/check-barcode?barcode=123456
[HttpGet("check-barcode")]
public async Task<IActionResult> CheckBarcodeExists([FromQuery] string barcode)
{
    if (string.IsNullOrWhiteSpace(barcode))
    {
        return BadRequest(new { message = "Vui lòng cung cấp mã barcode." });
    }

    var exists = await _context.Products.AnyAsync(p => p.Barcode == barcode);

    return Ok(new
    {
        barcode,
        exists
    });
}

    public class ProductsDTO
    {
        public int ProductsId { get; set; }
        public string Name { get; set; } = null!;
        public string Barcode { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal? Weight { get; set; }
        public decimal? Volume { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
    }
}
