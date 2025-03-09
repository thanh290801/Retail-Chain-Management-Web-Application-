using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class CashTransaction
    {
        public CashTransaction()
        {
            FundTransactionHistories = new HashSet<FundTransactionHistory>();
            Payments = new HashSet<Payment>();
        }

        public int TransactionId { get; set; }
        public int FundId { get; set; }
        public string TransactionCode { get; set; } = null!;
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } = null!;
        public decimal Amount { get; set; }
        public string SourceType { get; set; } = null!;
        public int EmployeeId { get; set; }

        public virtual Employee Employee { get; set; } = null!;
        public virtual Fund Fund { get; set; } = null!;
        public virtual ICollection<FundTransactionHistory> FundTransactionHistories { get; set; }
        public virtual ICollection<Payment> Payments { get; set; }
    }
}
