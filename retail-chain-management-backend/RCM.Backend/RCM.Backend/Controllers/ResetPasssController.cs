using Microsoft.AspNetCore.Mvc;
using Dapper;
using Microsoft.Data.SqlClient;
using System;
using System.Threading.Tasks;

[Route("api/resetpasss")]
[ApiController]
public class ResetPasssController : ControllerBase
{
    private readonly string _connectionString;

    public ResetPasssController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
    }

    /// <summary>
    /// 🔹 Gửi OTP để đặt lại mật khẩu
    /// </summary>
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        try
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                // 🔹 1. Tìm AccountID từ Username
                string getAccountQuery = "SELECT AccountID FROM Account WHERE Username = @Username";
                int? accountId = await connection.ExecuteScalarAsync<int?>(getAccountQuery, new { request.Username });

                if (accountId == null)
                    return NotFound(new { message = "Không tìm thấy tài khoản." });

                // 🔹 2. Lấy số điện thoại từ bảng Employee
                string getPhoneQuery = "SELECT Phone FROM Employee WHERE AccountID = @AccountID";
                string phoneNumber = await connection.ExecuteScalarAsync<string>(getPhoneQuery, new { AccountID = accountId });

                if (string.IsNullOrEmpty(phoneNumber))
                    return NotFound(new { message = "Không tìm thấy số điện thoại của nhân viên." });

                // 🔹 3. Tạo mã OTP ngẫu nhiên (6 số)
                Random random = new Random();
                string otpCode = random.Next(100000, 999999).ToString();

                // 🔹 4. Lưu OTP vào bảng Account, thời hạn 5 phút
                string updateOtpQuery = @"
                    UPDATE Account SET ResetOTP = @OtpCode, OTPExpireTime = DATEADD(MINUTE, 5, GETDATE()) 
                    WHERE AccountID = @AccountID";
                await connection.ExecuteAsync(updateOtpQuery, new { OtpCode = otpCode, AccountID = accountId });

                // 🔹 5. Giả lập gửi OTP (Thực tế nên tích hợp Twilio, Firebase SMS,...)
                Console.WriteLine($"[SMS] Gửi OTP: {otpCode} đến số {phoneNumber}");

                return Ok(new { message = "OTP đã được gửi tới số điện thoại." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", error = ex.Message });
        }
    }

    /// <summary>
    /// 🔹 Xác nhận OTP và đặt lại mật khẩu
    /// </summary>
    [HttpPost("confirm-reset")]
    public async Task<IActionResult> ConfirmResetPassword([FromBody] ConfirmResetRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.OTP) || string.IsNullOrWhiteSpace(request.PasswordHash))
        {
            return BadRequest(new { message = "Thông tin không hợp lệ." });
        }

        // 🔹 Kiểm tra độ dài mật khẩu tối thiểu 6 ký tự
        if (request.PasswordHash.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu mới phải có ít nhất 6 ký tự." });
        }

        try
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                // 🔹 1. Lấy AccountID từ Username
                string getAccountIdQuery = "SELECT AccountID FROM Account WHERE Username = @Username";
                int? accountId = await connection.ExecuteScalarAsync<int?>(getAccountIdQuery, new { request.Username });

                if (accountId == null)
                    return NotFound(new { message = "Không tìm thấy tài khoản." });

                // 🔹 2. Kiểm tra OTP hợp lệ (và chưa hết hạn)
                string checkOtpQuery = @"
                    SELECT COUNT(*) FROM Account 
                    WHERE AccountID = @AccountID AND ResetOTP = @OTP AND OTPExpireTime > GETDATE()";
                int isValidOTP = await connection.ExecuteScalarAsync<int>(checkOtpQuery, new { AccountID = accountId, request.OTP });

                if (isValidOTP == 0)
                    return BadRequest(new { message = "Mã OTP không hợp lệ hoặc đã hết hạn." });

                // 🔹 3. Cập nhật mật khẩu mới vào bảng Account (Không mã hóa)
                string updateQuery = @"
                    UPDATE Account SET PasswordHash  = @PasswordHash, ResetOTP = NULL, OTPExpireTime = NULL 
                    WHERE AccountID = @AccountID";
                await connection.ExecuteAsync(updateQuery, new { PasswordHash = request.PasswordHash, AccountID = accountId });

                return Ok(new { message = "Mật khẩu đã được đặt lại thành công." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", error = ex.Message });
        }
    }
}

// 🛠 DTO Models
public class ConfirmResetRequest
{
    public string Username { get; set; }
    public string OTP { get; set; }
    public string PasswordHash { get; set; }
}

public class SendOtpRequest
{
    public string Username { get; set; }
}
