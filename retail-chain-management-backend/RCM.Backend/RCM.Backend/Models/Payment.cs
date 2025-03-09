using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Payment
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int PaymentMethodId { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string? TransactionId { get; set; }
        public DateTime PaymentDate { get; set; }
        public int? CashTransactionId { get; set; }
        public int? BankTransactionId { get; set; }

        public virtual BankTransaction? BankTransaction { get; set; }
        public virtual CashTransaction? CashTransaction { get; set; }
        public virtual Order Order { get; set; } = null!;
        public virtual PaymentMethod PaymentMethod { get; set; } = null!;
    }
}
