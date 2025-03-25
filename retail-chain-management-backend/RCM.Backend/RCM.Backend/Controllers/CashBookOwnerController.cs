using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CashBookOwnerController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public CashBookOwnerController(RetailChainContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 📌 1. API Lấy danh sách chi nhánh
        /// </summary>
        [HttpGet("branches")]
        public async Task<IActionResult> GetBranches()
        {
            try
            {
                var branches = await _context.Warehouses
                .Select(b => new { b.WarehousesId, b.Name })
                .ToListAsync();
            if (!branches.Any())
                return NotFound(new { message = "Không có chi nhánh nào trong hệ thống." });

            return Ok(branches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi máy chủ khi lấy danh sách chi nhánh.", error = ex.Message });
            }
        }

        /// <summary>
        /// 📌 2. API Lấy sổ quỹ theo chi nhánh & thời gian
        /// </summary>
        [HttpGet("cashbook")]
        public async Task<IActionResult> GetCashbook([FromQuery] int branchId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            if (branchId <= 0)
                return BadRequest(new { message = "Vui lòng chọn chi nhánh hợp lệ." });

            // Nếu không chọn ngày, mặc định hiển thị giao dịch hôm nay
            DateTime startDate = fromDate ?? DateTime.Today;
            DateTime endDate = toDate?.AddDays(1) ?? DateTime.Today.AddDays(1);

            var cashbookTransactions = await _context.Transactions
                .Where(t => t.TransactionDate >= startDate && t.TransactionDate < endDate && t.BranchId == branchId)
                .Where(t => t.TransactionType == "POS_CASH_PAYMENT"
                            ||t.TransactionType=="POS_BANK_PAYMENT"
                            || t.TransactionType == "CASH_HANDOVER"
                            || t.TransactionType == "CASH_EXPENSE"
                            || t.TransactionType == "CASH_REFUND")
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new
                {
                    t.TransactionId,
                    t.TransactionDate,
                    t.TransactionCode,
                    t.TransactionType,
                    t.Amount,
                    t.Description,
                    t.PerformedBy,
                    t.PaymentMethod
                })
                .ToListAsync();

            return Ok(new { Transactions = cashbookTransactions });
        }

        /// <summary>
        /// 📌 3. API Lấy tổng thu/chi/tồn quỹ
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetCashSummary([FromQuery] int? branchId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            
            DateTime startDate = fromDate ?? DateTime.Today;
            DateTime endDate = toDate?.AddDays(1) ?? DateTime.Today.AddDays(1);

            var query = _context.Transactions
                .Where(t => t.TransactionDate >= startDate && t.TransactionDate < endDate);

            if (branchId.HasValue && branchId.Value > 0)
            {
                query = query.Where(t => t.BranchId == branchId.Value);
            }
            var transactions = await query.ToListAsync();

            decimal totalBank = transactions
                .Where(t => t.TransactionType == "POS_BANK_PAYMENT")
                .Sum(t => t.Amount);

            decimal totalCash = transactions
               .Where(t => t.TransactionType == "POS_CASH_PAYMENT")
               .Sum(t => t.Amount);

            decimal totalIncome = transactions
                .Where(t => t.TransactionType == "POS_CASH_PAYMENT" || t.TransactionType == "CASH_HANDOVER")
                .Sum(t => t.Amount);

            decimal totalExpense = transactions
                .Where(t => t.TransactionType == "CASH_EXPENSE" || t.TransactionType == "CASH_REFUND")
                .Sum(t => t.Amount);

            decimal currentBalance = totalIncome - totalExpense;

            decimal totalRevenue = totalBank + totalCash;


            return Ok(new
            {
                TotalRevenue = totalRevenue,
                TotalCash = totalCash,
                TotalBank =totalBank,
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                CurrentBalance = currentBalance
            });
        }
    }
}
