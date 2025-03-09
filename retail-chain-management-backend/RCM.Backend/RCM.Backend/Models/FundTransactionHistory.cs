using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class FundTransactionHistory
    {
        public int TransactionHistoryId { get; set; }
        public int FundId { get; set; }
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } = null!;
        public decimal Amount { get; set; }
        public string SourceType { get; set; } = null!;
        public int? RelatedOrderId { get; set; }
        public int? RelatedRefundId { get; set; }
        public int? RelatedCashTransactionId { get; set; }
        public int? RelatedBankTransactionId { get; set; }
        public string? Notes { get; set; }

        public virtual Fund Fund { get; set; } = null!;
        public virtual BankTransaction? RelatedBankTransaction { get; set; }
        public virtual CashTransaction? RelatedCashTransaction { get; set; }
        public virtual Order? RelatedOrder { get; set; }
        public virtual Refund? RelatedRefund { get; set; }
    }
}
