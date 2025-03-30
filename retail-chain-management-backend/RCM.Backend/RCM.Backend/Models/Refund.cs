using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Refund
    {
        public Refund()
        {
            RefundDetails = new HashSet<RefundDetail>();
            Transactions = new HashSet<Transaction>();
        }

        public int Id { get; set; }
        public int OrderId { get; set; }
        public int Employeeid { get; set; }
        public DateTime RefundDate { get; set; }
        public decimal RefundAmount { get; set; }
        public string RefundStatus { get; set; } = null!;

        public virtual Employee Employee { get; set; } = null!;
        public virtual Order Order { get; set; } = null!;
        public virtual ICollection<RefundDetail> RefundDetails { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; }
    }
}
