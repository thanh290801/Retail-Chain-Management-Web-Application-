using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Salary
    {
        public Salary()
        {
            SalaryPaymentHistories = new HashSet<SalaryPaymentHistory>();
        }

        public int SalaryId { get; set; }
        public int EmployeeId { get; set; }
        public int? FixedSalary { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? BonusSalary { get; set; }
        public int? Penalty { get; set; }
        public int? FinalSalary { get; set; }
        public int? WorkingDays { get; set; }
        public decimal? BonusHours { get; set; }
        public int? SalaryPerShift { get; set; }
        public bool IsCalculated { get; set; }
        public DateTime? UpdateAt { get; set; }

        public virtual Employee Employee { get; set; } = null!;
        public virtual ICollection<SalaryPaymentHistory> SalaryPaymentHistories { get; set; }
    }
}
