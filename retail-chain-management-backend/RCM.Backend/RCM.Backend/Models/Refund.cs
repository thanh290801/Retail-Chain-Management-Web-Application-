using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Refund
    {
        public Refund()
        {
            FundTransactionHistories = new HashSet<FundTransactionHistory>();
            RefundDetails = new HashSet<RefundDetail>();
        }

        public int Id { get; set; }
        public int OrderId { get; set; }
        public int Employeeid { get; set; }
        public DateTime RefundDate { get; set; }
        public decimal RefundAmount { get; set; }
        public string RefundStatus { get; set; } = null!;

        public virtual Employee Employee { get; set; } = null!;
        public virtual Order Order { get; set; } = null!;
        public virtual ICollection<FundTransactionHistory> FundTransactionHistories { get; set; }
        public virtual ICollection<RefundDetail> RefundDetails { get; set; }
    }
}
