
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;
using System.Security.Claims;


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
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            // Kiểm tra xem User.Identity có null không
            var identity = User.Identity as ClaimsIdentity;
            if (identity == null || !identity.IsAuthenticated)
            {
                return Unauthorized("Bạn chưa đăng nhập.");
            }


            // Lấy username từ Claims
            var username = identity.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized("Không thể lấy thông tin người dùng từ Token.");
            }

            // Truy vấn thông tin người dùng từ DB
            var user = _context.Account
                               .Where(a => a.Username == username)
                               .Select(a => new
                               {
                                   a.Username,
                                   a.Role
                               })
                               .FirstOrDefault();

            if (user == null)
                return NotFound("Người dùng không tồn tại.");

            return Ok(user);
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


