using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace RCM.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public AccountController(RetailChainContext context)
        {
            _context = context;
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<Employee>>> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Select(emp => new
                {
                    emp.EmployeeId,
                    emp.FullName,
                    emp.BranchId,
                    emp.IsActive
                })
                .ToListAsync();

            if (employees == null || employees.Count == 0)
            {
                return NotFound("Không có nhân viên nào trong hệ thống.");
            }

            return Ok(employees);
        }

        // ✅ API: Lấy thông tin người dùng hiện tại (dựa trên token)
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // 📌 Lấy thông tin Claims từ Token
                var identity = User.Identity as ClaimsIdentity;
                if (identity == null || !identity.IsAuthenticated)
                {
                    return Unauthorized(new { message = "Bạn chưa đăng nhập." });
                }

                // 📌 Lấy username từ Claims
                var username = identity.FindFirst(ClaimTypes.Name)?.Value;
                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized(new { message = "Không thể lấy thông tin người dùng từ Token." });
                }

                // 📌 Truy vấn thông tin người dùng từ Database
                var user = await _context.Accounts
    .Include(a => a.Employee)
    .Where(a => a.Username == username)
    .Select(a => new
    {
        Fullname = a.Employee != null ? a.Employee.FullName : "Chưa có nhân viên",
        Role = a.Role
    })
    .FirstOrDefaultAsync();


                if (user == null)
                    return NotFound(new { message = "Người dùng không tồn tại." });

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi máy chủ nội bộ", error = ex.Message });
            }
        }
    }
}
