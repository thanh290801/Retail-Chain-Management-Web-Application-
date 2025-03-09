using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using RCM.Backend.Models; // Đảm bảo namespace đúng với Product
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly RCMDbContext _context;

    // Constructor đúng tên class
    public ProductsController(RCMDbContext context)
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
                message = $"Sản phẩm đã được {(product.IsEnabled ? "bật" : "tắt")}.",
             product
            });
    }
}
