using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class EndShift
    {
        public int ShiftId { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalSales { get; set; }
        public decimal CashCollected { get; set; }
        public decimal BankCollected { get; set; }
        public decimal CashAtStart { get; set; }
        public decimal CashAtEnd { get; set; }

        public virtual Warehouse Branch { get; set; } = null!;
        public virtual Employee Employee { get; set; } = null!;
    }
}
