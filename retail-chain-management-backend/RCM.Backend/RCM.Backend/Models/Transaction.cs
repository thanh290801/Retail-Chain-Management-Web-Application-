using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Transaction
    {
        public int TransactionId { get; set; }
        public string TransactionCode { get; set; } = null!;
        public string TransactionType { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? ReferenceId { get; set; }
        public string? BankAccount { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public string? PerformedBy { get; set; }
        public int? OrderId { get; set; }
        public int? RefundId { get; set; }
        public int? HandoverId { get; set; }
        public string? Description { get; set; }

        public virtual Warehouse Branch { get; set; } = null!;
        public virtual Employee Employee { get; set; } = null!;
        public virtual CashHandover? Handover { get; set; }
        public virtual Order? Order { get; set; }
        public virtual Refund? Refund { get; set; }
    }
}
