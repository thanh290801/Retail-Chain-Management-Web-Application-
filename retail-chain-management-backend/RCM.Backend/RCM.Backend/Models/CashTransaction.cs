using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace RCM.Backend.Models
{
    public partial class CashTransaction
    {
        public CashTransaction()
        {
            FundTransactionHistories = new HashSet<FundTransactionHistory>();
        }
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionId { get; set; }
        public int FundId { get; set; }
        public string TransactionCode { get; set; } = null!;
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } = null!;
        public decimal Amount { get; set; }
        public string SourceType { get; set; } = null!;
        public int EmployeeId { get; set; }
        public int? OrderId { get; set; }
        public int? BranchID { get; set; }
        public string Description { get; set; }
        public string FullName { get; set; } = null!;

        public int? HandoverID { get; set; }
        public virtual CashHandover Handover { get; set; }
        public virtual Employee Employee { get; set; } = null!;
        public virtual Fund Fund { get; set; } = null!;
        public virtual Order? Order { get; set; }
        public virtual ICollection<FundTransactionHistory> FundTransactionHistories { get; set; }
    }
}
