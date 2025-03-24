using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTOs;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers.Supplier_Order 
{ 
     [Route("api/[controller]")]
     [ApiController]

    public class ProductController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public ProductController(RetailChainContext context)
        {
            _context = context;
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
        [HttpGet]
        public async Task<IActionResult> GetProduct()
        {
            var suppliers = await _context.Products
                .Select(s => new
                {
                    s.Name,
                    s.Barcode,
                    Unit = s.Unit ?? "", // 🟢 Tránh NULL
                    s.Weight, // 🟢 Nếu NULL thì thay bằng ""
                    s.Volume ,
                    ImageUrl = s.ImageUrl ?? "",
                    Category = s.Category ?? ""               
                })
                .ToListAsync();

            return Ok(suppliers);
        }


    }
}
