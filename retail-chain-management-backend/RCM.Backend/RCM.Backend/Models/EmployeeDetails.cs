using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
   
        public class EmployeeDetails
        {
            [Key]
            public int EmployeeID { get; set; }

            [ForeignKey("Account")]
            public int AccountID { get; set; }
            public Account Account { get; set; }

            [Required]
            [StringLength(100)]
            public string FullName { get; set; }

            [StringLength(20)]
            public string Phone { get; set; }

            [StringLength(100)]
            public string Email { get; set; }

            [StringLength(255)]
            public string Address { get; set; }
        }
    }

