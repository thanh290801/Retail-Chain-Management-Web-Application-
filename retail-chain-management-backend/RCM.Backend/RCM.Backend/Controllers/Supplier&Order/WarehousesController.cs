using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTOs;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers.Supplier_Order
{
    [Route("api/[controller]")]
    [ApiController]
    public class WarehousesController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public WarehousesController(RetailChainContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Warehouse>>> GetWarehouses()
        {
            return await _context.Warehouses.ToListAsync();
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] WarehouseUpdateDto dto)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
                return NotFound("Không tìm thấy kho.");

            warehouse.Name = dto.Name;
            warehouse.Address = dto.Address;
            warehouse.Capacity = dto.Capacity;

            await _context.SaveChangesAsync();
            return NoContent();
        }


    }
}
