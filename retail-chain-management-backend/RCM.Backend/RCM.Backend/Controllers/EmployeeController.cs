using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dapper;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using System.Security.Claims;

[Route("api/employees")]
[ApiController]
[Authorize] // Chỉ người đã đăng nhập mới có quyền gọi API này
public class EmployeeController : ControllerBase
{
    private readonly string _connectionString;

    public EmployeeController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")!;
    }

    // GET: api/employees/profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetLoggedInEmployeeProfile()
    {
        try
        {
            var accountIdClaim = User.FindFirst("AccountId")?.Value;

            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized(new { message = "Không tìm thấy thông tin đăng nhập." });

            int accountId = int.Parse(accountIdClaim);

            using (var connection = new SqlConnection(_connectionString))
            {
                string query = @"
                    SELECT 
                        e.EmployeeID,
                        e.AccountID,
                        e.FullName,
                        e.Phone,
                        e.Gender,
                        e.BirthDate,
                        e.IdentityNumber,
                        e.Hometown,
                        e.FixedSalary,
                        e.IsActive,
                        e.StartDate,
                        e.BranchID,
                        e.IsCheckedIn,
                        e.ProfileImage,
                        w.name AS BranchName
                    FROM Employee e
                    LEFT JOIN warehouses w ON e.BranchID = w.WarehousesId
                    WHERE e.AccountID = @accountId";

                var employee = await connection.QueryFirstOrDefaultAsync<EmployeeProfileDTO>(query, new { accountId });

                if (employee == null)
                    return NotFound(new { message = "Không tìm thấy thông tin nhân viên." });

                return Ok(employee);
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi hệ thống.", error = ex.Message });
        }
    }

    // PUT: api/employees/update-profile
    [HttpPut("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateEmployeeDTO updatedInfo)
    {
        try
        {
            var accountIdClaim = User.FindFirst("AccountId")?.Value;

            if (string.IsNullOrEmpty(accountIdClaim))
                return Unauthorized(new { message = "Không xác định được người dùng." });

            int accountId = int.Parse(accountIdClaim);

            using (var connection = new SqlConnection(_connectionString))
            {
                string updateQuery = @"
                    UPDATE Employee
                    SET 
                        FullName = @FullName,
                        Phone = @Phone,
                        Gender = @Gender,
                        BirthDate = @BirthDate,
                        Hometown = @Hometown
                    WHERE AccountID = @AccountId";

                var result = await connection.ExecuteAsync(updateQuery, new
                {
                    updatedInfo.FullName,
                    updatedInfo.Phone,
                    updatedInfo.Gender,
                    updatedInfo.BirthDate,
                    updatedInfo.Hometown,
                    AccountId = accountId
                });

                if (result == 0)
                    return NotFound(new { message = "Không tìm thấy nhân viên để cập nhật." });

                return Ok(new { message = "Cập nhật thông tin thành công." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật thông tin.", error = ex.Message });
        }
    }
}

// Dùng cho hiển thị hồ sơ
public class EmployeeProfileDTO
{
    public int EmployeeID { get; set; }
    public int AccountID { get; set; }
    public string FullName { get; set; }
    public string Phone { get; set; }
    public string Gender { get; set; }
    public DateTime BirthDate { get; set; }
    public string IdentityNumber { get; set; }
    public string Hometown { get; set; }
    public int? FixedSalary { get; set; }
    public bool? IsActive { get; set; }
    public DateTime StartDate { get; set; }
    public int? BranchID { get; set; }
    public string BranchName { get; set; }
    public bool? IsCheckedIn { get; set; }
    public string ProfileImage { get; set; }
}

// Dùng cho cập nhật thông tin cá nhân
public class UpdateEmployeeDTO
{
    public string FullName { get; set; }
    public string Phone { get; set; }
    public string Gender { get; set; }
    public DateTime BirthDate { get; set; }
    public string Hometown { get; set; }
}
