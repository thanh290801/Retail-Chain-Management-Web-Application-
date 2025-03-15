using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using RCM.Backend.Models; // Đảm bảo namespace đúng với Product
[ApiController]
[Route("api/[controller]")]
public class SuppliersController : ControllerBase
{
private readonly RetailChainContext _context;

    // Constructor đúng tên class
    public SuppliersController(RetailChainContext context)
    {
        _context = context;
    }

    [HttpGet("get-all")]
public async Task<ActionResult<IEnumerable<object>>> GetAllSuppliers()
{
    var suppliers = await _context.Suppliers
        .Select(s => new
        {
            s.SuppliersId,
            s.Name,
            s.Phone,
            s.Email,
            s.Address
        })
        .ToListAsync();

    return Ok(suppliers);
}

}