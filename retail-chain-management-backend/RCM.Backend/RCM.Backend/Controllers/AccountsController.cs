using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using RCM.Backend.Models; // Đổi namespace này theo dự án của bạn

namespace RetailChain.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public AccountsController(RetailChainContext context)
        {
            _context = context;
        }

        // GET: api/Accounts/avatar/1
        [HttpGet("avatar/{accountId}")]
        public async Task<IActionResult> GetUserAvatar(int accountId)
        {
            var employee = await _context.Employees
                .Where(e => e.AccountId == accountId)
                .Select(e => new
                {
                    AvatarUrl = e.ProfileImage
                })
                .FirstOrDefaultAsync();

            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên." });
            }

            return Ok(new { avatarUrl = employee.AvatarUrl });
        }
    }
}
