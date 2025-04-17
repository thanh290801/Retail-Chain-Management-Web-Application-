using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class StockLevelsController : ControllerBase
{
    private readonly RetailChainContext _context;

    public StockLevelsController(RetailChainContext context)
    {
        _context = context;
    }

    // API cập nhật số lượng tồn kho tối thiểu của nhiều sản phẩm trong kho
    [HttpPut("update-min-quantity")]
    public async Task<IActionResult> UpdateMinStock([FromBody] List<UpdateMinStockRequest> updateRequests)
    {
        if (updateRequests == null || !updateRequests.Any())
        {
            return BadRequest(new { message = "Danh sách cập nhật không được để trống." });
        }

        // Lấy danh sách ProductId từ request
        var productIds = updateRequests.Select(r => r.ProductId).ToList();

        // Truy vấn tất cả các StockLevels liên quan
        var stockLevels = await _context.StockLevels
            .Where(sl => productIds.Contains(sl.ProductId))
            .ToListAsync();

        if (stockLevels.Count == 0)
        {
            return NotFound(new { message = "Không tìm thấy sản phẩm trong kho." });
        }

        // Cập nhật MinQuantity của các sản phẩm
        foreach (var stock in stockLevels)
        {
            var updateItem = updateRequests.FirstOrDefault(r => r.ProductId == stock.ProductId);
            if (updateItem != null)
            {
                stock.MinQuantity = updateItem.MinQuantity;
            }
        }

        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật số lượng tồn kho tối thiểu thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật số lượng tồn kho tối thiểu.", error = ex.Message });
        }
    }
}

// DTO để nhận dữ liệu từ request
public class UpdateMinStockRequest
{
    public int ProductId { get; set; }
    public int MinQuantity { get; set; }
}
