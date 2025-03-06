using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;
using RCM.Backend.Services;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IJwtService _jwtService;

    public AuthController(IUserService userService, IJwtService jwtService)
    {
        _userService = userService;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // Kiểm tra thông tin đăng nhập trong database
        var user = _userService.Authenticate(request.Username, request.Password);

        // Nếu không tìm thấy user, trả về lỗi 401 (Unauthorized)
        if (user == null)
            return Unauthorized("Sai tài khoản hoặc mật khẩu.");

        // Tạo JWT Token khi đăng nhập thành công
        var token = _jwtService.GenerateToken(user);

        // Trả về thông tin đăng nhập và Token
        return Ok(new AuthResponse
        {
            Token = token,
            Role = user.Role,
            Username = user.Username
        });
    }
}
