using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using RCM.Backend.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;

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
        var user = _context.Accounts
            .Include(a => a.Employee) // Lấy thông tin nhân viên
            .FirstOrDefault(a => a.Username == request.Username);

        if (user == null)
        {

            return Unauthorized(new { message = "Không tìm thấy thông tin tài khoản." });

        }

        // Kiểm tra xem tài khoản có tồn tại và mật khẩu có khớp không (không hash)
        bool isMatch = request.Password == user.PasswordHash;

        if (!isMatch)
        {
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
        }

        var employee = user.Employee;
        if (employee == null)
        {
            return Unauthorized(new { message = "Không tìm thấy thông tin nhân viên." });
        }

        var token = GenerateJwtToken(user, employee.BranchId);

        return Ok(new
        {
            token,
            role = user.Role,
            username = user.Username,
            branchId = employee.BranchId
        });
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
            _config["JwtSettings:Issuer"],
            _config["JwtSettings:Audience"],
            claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
