using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Fund
    {
        public Fund()
        {
            BankTransactions = new HashSet<BankTransaction>();
            CashTransactions = new HashSet<CashTransaction>();
            FundTransactionHistories = new HashSet<FundTransactionHistory>();
        }

        public int FundId { get; set; }
        public int BranchId { get; set; }
        public string FundType { get; set; } = null!;
        public decimal Balance { get; set; }
        public DateTime LastUpdated { get; set; }

        public virtual Warehouse Branch { get; set; } = null!;
        public virtual ICollection<BankTransaction> BankTransactions { get; set; }
        public virtual ICollection<CashTransaction> CashTransactions { get; set; }
        public virtual ICollection<FundTransactionHistory> FundTransactionHistories { get; set; }
    }
}
