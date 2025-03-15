using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RCM.Backend.Models;
using RCM.Backend.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly RetailChainContext _context; // Inject DbContext để truy vấn dữ liệu

    public JwtService(IConfiguration configuration, RetailChainContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    public string GenerateToken(Account user)
    {
        // Truy vấn Employee để lấy BranchID từ AccountID
        var employee = _context.Employees
            .Where(e => e.AccountId == user.AccountId)
            .Select(e => new { e.EmployeeId, e.BranchId })
            .FirstOrDefault();

        if (employee == null)
        {
            throw new Exception("Không tìm thấy Employee tương ứng với Account.");
        }

        var branchId = employee.BranchId ?? 0; // Nếu BranchID NULL, gán mặc định là 0

        // Tạo danh sách claims
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("AccountId", user.AccountId.ToString()), // Thêm AccountID vào token
            new Claim("BranchID", branchId.ToString()), // Thêm BranchID vào token
        };

        // Mã hóa key và tạo credentials
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Tạo token JWT
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
