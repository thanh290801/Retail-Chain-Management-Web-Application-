
    using Microsoft.AspNetCore.Mvc;
    using RCM.Backend.Models;

namespace RCM.Backend.Controllers
{
    [ApiController]
        [Route("api/[controller]")]
        public class AccountController : ControllerBase
        {
            private readonly RCMDbContext _context;

            public AccountController(RCMDbContext context)
            {
                _context = context;
            }

            [HttpGet("all")]
            public IActionResult GetAllAccounts()
            {
                var accounts = _context.Account.ToList();
                return Ok(accounts);
            }

            [HttpPost("add")]
            public IActionResult AddAccount([FromBody] Account account)
            {
                _context.Account.Add(account);
                _context.SaveChanges();
                return Ok("Thêm tài khoản thành công.");
            }

            [HttpDelete("delete/{id}")]
            public IActionResult DeleteAccount(int id)
            {
                var account = _context.Account.Find(id);
                if (account == null) return NotFound("Không tìm thấy tài khoản.");

                _context.Account.Remove(account);
                _context.SaveChanges();
                return Ok("Xóa tài khoản thành công.");
            }
        }
    }


