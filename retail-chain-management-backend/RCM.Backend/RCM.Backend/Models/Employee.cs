using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Employee
    {
        public Employee()
        {
            AttendanceRecords = new HashSet<AttendanceRecord>();
            BankTransactions = new HashSet<BankTransaction>();
            CashTransactions = new HashSet<CashTransaction>();
            Orders = new HashSet<Order>();
            Refunds = new HashSet<Refund>();
            Salaries = new HashSet<Salary>();
        }

        public int EmployeeId { get; set; }
        public int? AccountId { get; set; }
        public string? ProfileImage { get; set; }
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Gender { get; set; }
        public DateTime BirthDate { get; set; }
        public string IdentityNumber { get; set; } = null!;
        public string? Hometown { get; set; }
        public int? WorkShiftId { get; set; }
        public int? FixedSalary { get; set; }
        public bool? IsActive { get; set; }
        public DateTime StartDate { get; set; }
        public int? BranchId { get; set; }
        public bool? IsCheckedIn { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public virtual Account? Account { get; set; }
        public virtual Warehouse? Branch { get; set; }
        public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; }
        public virtual ICollection<BankTransaction> BankTransactions { get; set; }
        public virtual ICollection<CashTransaction> CashTransactions { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<Refund> Refunds { get; set; }
        public virtual ICollection<Salary> Salaries { get; set; }
    }
}
