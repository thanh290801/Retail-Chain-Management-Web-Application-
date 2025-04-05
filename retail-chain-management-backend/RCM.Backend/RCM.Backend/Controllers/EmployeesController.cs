using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers
{
    [Route("api/employee")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public EmployeesController(RetailChainContext context)
        {
            _context = context;
        }

        // GET: api/employee
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllEmployees()
        {
            try
            {
                var employees = await _context.Employees
                    .Select(e => new
                    {
                        e.EmployeeId,
                        e.FullName,
                        e.Phone,
                        e.Gender,
                        e.BirthDate,
                        e.IdentityNumber,
                        e.Hometown,
                        e.WorkShiftId,
                        e.FixedSalary,
                        e.IsActive,
                        e.StartDate,
                        e.BranchId,
                        e.IsCheckedIn,
                        e.CreatedAt,
                        e.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(employees);
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Lỗi lấy danh sách nhân viên: " + ex.Message);
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }
    }
}
