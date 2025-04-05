using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using RCM.Backend.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly RetailChainContext _context;
    private readonly IConfiguration _config;
    private readonly IUserService _userService;

    public AuthController(RetailChainContext context, IConfiguration config, IUserService userService)
    {
        _context = context;
        _config = config;
        _userService = userService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Dữ liệu đăng nhập không hợp lệ." });
        }

        var user = _context.Accounts
            .Include(a => a.Employee) // Lấy thông tin nhân viên
            .FirstOrDefault(a => a.Username == request.Username );

        if (user == null)
        {
            return Unauthorized(new { message = "Không tìm thấy thông tin tài khoản." });
        }

        // Kiểm tra mật khẩu (không hash)
        bool isMatch = request.Password == user.PasswordHash;
        if (!isMatch)
        {
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
        }

        var employee = user.Employee;
        if (employee == null || employee.IsActive ==false)
        {
            return Unauthorized(new { message = "Không tìm thấy thông tin nhân viên." });
        }

        var token = GenerateJwtToken(user, employee.BranchId);

        return Ok(new
        {
            token,
            role = user.Role,
            username = user.Username,
            branchId = employee.BranchId,
            employeeId = employee.EmployeeId
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Vì JWT là stateless, server không cần làm gì ngoài việc trả về thông báo thành công
        // Client sẽ tự xóa token ở phía front-end
        return Ok(new { message = "Đăng xuất thành công." });
    }

    private string GenerateJwtToken(Account user, int? branchId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("BranchId", branchId?.ToString() ?? "0"),
            new Claim("AccountId", user.AccountId.ToString(), ClaimValueTypes.Integer)
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1), // Token hết hạn sau 8 tiếng
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

