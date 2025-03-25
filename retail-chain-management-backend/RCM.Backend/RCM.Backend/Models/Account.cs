using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Account
    {
        public Account()
        {
            Employees = new HashSet<Employee>();
            ProductPriceHistories = new HashSet<ProductPriceHistory>();
            StockAdjustments = new HashSet<StockAdjustment>();
            StockAuditRecordAuditors = new HashSet<StockAuditRecord>();
            StockAuditRecordCoAuditors = new HashSet<StockAuditRecord>();
            WarehouseTransfers = new HashSet<WarehouseTransfer>();
        }

        public int AccountId { get; set; }
        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = null!;
        public bool? IsActive { get; set; }

        public virtual ICollection<Employee> Employees { get; set; }
        public virtual ICollection<ProductPriceHistory> ProductPriceHistories { get; set; }
        public virtual ICollection<StockAdjustment> StockAdjustments { get; set; }
        public virtual ICollection<StockAuditRecord> StockAuditRecordAuditors { get; set; }
        public virtual ICollection<StockAuditRecord> StockAuditRecordCoAuditors { get; set; }
        public virtual ICollection<WarehouseTransfer> WarehouseTransfers { get; set; }
    }
}
