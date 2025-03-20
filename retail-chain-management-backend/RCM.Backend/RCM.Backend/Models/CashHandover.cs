using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class CashHandover
    {
        public CashHandover()
        {
            Transactions = new HashSet<Transaction>();
        }

        public int HandoverId { get; set; }
        public DateTime TransactionDate { get; set; }
        public int EmployeeId { get; set; }
        public int? ReceiverId { get; set; }
        public int BranchId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = null!;
        public string? Description { get; set; }
        public string CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string PersonName { get; set; } = null!;
        public string? Note { get; set; }

        public virtual Warehouse Branch { get; set; } = null!;
        public virtual Employee Employee { get; set; } = null!;
        public virtual Employee? Receiver { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; }
    }
}
