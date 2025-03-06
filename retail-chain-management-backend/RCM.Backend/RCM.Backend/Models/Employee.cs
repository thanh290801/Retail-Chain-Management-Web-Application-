using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace RCM.Backend.Models;

public class Employee
{
    [Key]
    public int EmployeeID { get; set; }

    [ForeignKey("AccountID")]
    public int AccountID { get; set; }
    public Account Account { get; set; }

    [Required]
    public string FullName { get; set; }

    public string Phone { get; set; }

    public string Gender { get; set; } // "Male" hoặc "Female"

    public DateTime BirthDate { get; set; }

    public string IdentityNumber { get; set; }

    public string Hometown { get; set; }

    public bool IsActive { get; set; } = true;

}

