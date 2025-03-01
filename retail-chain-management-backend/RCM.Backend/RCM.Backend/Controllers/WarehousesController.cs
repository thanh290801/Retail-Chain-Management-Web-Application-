using Microsoft.AspNetCore.Mvc;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly RCMDbContext _context;

    public WarehousesController(RCMDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetWarehouses()
    {
        var warehouses = _context.Warehouses
                                .Select(w => new { w.WarehousesId, w.Name })
                                .ToList();
        return Ok(warehouses);
    }
}
