using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Employee
    {
        public Employee()
        {
            AttendanceCheckIns = new HashSet<AttendanceCheckIn>();
            AttendanceCheckOuts = new HashSet<AttendanceCheckOut>();
            AttendanceRecords = new HashSet<AttendanceRecord>();
            CashHandoverEmployees = new HashSet<CashHandover>();
            CashHandoverReceivers = new HashSet<CashHandover>();
            Cashes = new HashSet<Cash>();
            EndShifts = new HashSet<EndShift>();
            Orders = new HashSet<Order>();
            OvertimeRecords = new HashSet<OvertimeRecord>();
            PenaltyPayments = new HashSet<PenaltyPayment>();
            Refunds = new HashSet<Refund>();
            Salaries = new HashSet<Salary>();
            SalaryPaymentHistories = new HashSet<SalaryPaymentHistory>();
            Transactions = new HashSet<Transaction>();
            AccountsAccounts = new HashSet<Account>();
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
        public virtual ICollection<AttendanceCheckIn> AttendanceCheckIns { get; set; }
        public virtual ICollection<AttendanceCheckOut> AttendanceCheckOuts { get; set; }
        public virtual ICollection<AttendanceRecord> AttendanceRecords { get; set; }
        public virtual ICollection<CashHandover> CashHandoverEmployees { get; set; }
        public virtual ICollection<CashHandover> CashHandoverReceivers { get; set; }
        public virtual ICollection<Cash> Cashes { get; set; }
        public virtual ICollection<EndShift> EndShifts { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<OvertimeRecord> OvertimeRecords { get; set; }
        public virtual ICollection<PenaltyPayment> PenaltyPayments { get; set; }
        public virtual ICollection<Refund> Refunds { get; set; }
        public virtual ICollection<Salary> Salaries { get; set; }
        public virtual ICollection<SalaryPaymentHistory> SalaryPaymentHistories { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; }

        public virtual ICollection<Account> AccountsAccounts { get; set; }
    }
}
