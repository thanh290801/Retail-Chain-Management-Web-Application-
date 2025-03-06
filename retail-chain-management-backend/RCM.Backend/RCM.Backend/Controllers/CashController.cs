using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace RCM.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CashController : ControllerBase
    {
        private readonly RCMDbContext _context;

        public CashController(RCMDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy số dư tiền mặt hiện tại
        /// </summary>
        [HttpGet("cash-on-hand")]
        public IActionResult GetCashOnHand()
        {
            var totalCash = _context.CashFund
                .Where(f => f.FundType == "Tiền mặt")
                .Sum(f => (decimal?)f.Balance) ?? 0; // Tránh lỗi null

            return Ok(new { cashOnHand = totalCash });
        }

        /// <summary>
        /// Lấy doanh thu hôm nay
        /// </summary>
        [HttpGet("today-revenue")]
        public IActionResult GetTodayRevenue()
        {
            var today = DateTime.Today;
            var revenue = _context.Orders
                .Where(o => o.CreatedDate >= today)
                .Sum(o => (decimal?)o.FinalAmount) ?? 0; // Tránh lỗi null

            return Ok(new { todayRevenue = revenue });
        }

        /// <summary>
        /// Lấy danh sách sản phẩm sắp hết trong kho
        /// </summary>
        [HttpGet("low-stock")]
        public IActionResult GetLowStockProducts()
        {
            var lowStockProducts = _context.StockLevels  // Đổi từ stock_levels sang StockLevels
                .Where(s => s.Quantity < s.MinQuantity)
                .Select(s => new
                {
                    s.ProductId,
                    s.Product.Name,
                    s.Quantity,
                    s.Product.Unit
                })
                .ToList();

            return Ok(lowStockProducts);
        }
    }
}
