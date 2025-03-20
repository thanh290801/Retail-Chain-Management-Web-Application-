﻿using DataLayerObject.Models;
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

    }
}
