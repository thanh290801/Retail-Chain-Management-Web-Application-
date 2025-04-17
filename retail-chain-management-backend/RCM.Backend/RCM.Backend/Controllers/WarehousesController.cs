
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers
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
        [HttpGet("GetWarehouses")]
        public IActionResult GetWarehouses()
        {
            var warehouses =  _context.Warehouses
                .Select(w => new
                {
                    w.WarehousesId,
                    w.Name,
                    w.Capacity
                })
                .ToList();

            return Ok(warehouses);
        }
        [HttpPost("get-by-id")]
        public IActionResult GetWarehouseById([FromBody] int id)
        {
            var warehouse = _context.Warehouses
                .Where(w => w.WarehousesId == id)
                .Select(w => new
                {
                    w.WarehousesId,
                    w.Name,
                    w.Capacity
                })
                .FirstOrDefault();

            if (warehouse == null)
            {
                return NotFound($"Không tìm thấy kho với ID = {id}");
            }

            return Ok(warehouse);
        }

    }
}
