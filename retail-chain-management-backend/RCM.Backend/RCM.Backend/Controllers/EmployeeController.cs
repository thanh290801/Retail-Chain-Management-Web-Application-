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

    [HttpGet("profile")]
    public async Task<IActionResult> GetLoggedInEmployeeProfile()
    {
        try
        {
            // 🔹 Lấy AccountID từ Token
            var accountIdClaim = User.FindFirst("AccountId")?.Value;

            if (accountIdClaim == null)
                return Unauthorized(new { message = "Không tìm thấy thông tin đăng nhập." });

            int employeeId = int.Parse(accountIdClaim); // 👈 nếu đây là AccountId, sửa tên biến lại

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

                var employee = await connection.QueryFirstOrDefaultAsync<EmployeeProfileDTO>(query, new { accountId = employeeId });

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

}

public class EmployeeProfileDTO
{
    public int EmployeeID { get; set; }
    public int AccountID { get; set; }       // ✅ Thêm dòng này
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

