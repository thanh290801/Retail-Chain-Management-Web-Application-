using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly RCMDbContext _context;

    public ProductsController(RCMDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetProducts()
    {
        var products = _context.Products.Select(p => new { p.ProductsId, p.Name,p.Category }).ToList();
        return Ok(products);
    }

}
