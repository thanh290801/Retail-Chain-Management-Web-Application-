using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Account
    {
        public Account()
        {
            Notifications = new HashSet<Notification>();
            ProductPriceHistories = new HashSet<ProductPriceHistory>();
            StockAdjustments = new HashSet<StockAdjustment>();
            StockAuditRecordAuditors = new HashSet<StockAuditRecord>();
            StockAuditRecordCoAuditors = new HashSet<StockAuditRecord>();
            WarehouseTransfers = new HashSet<WarehouseTransfer>();
            EmployeesEmployees = new HashSet<Employee>();
        }

        public int AccountId { get; set; }
        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = null!;
        public bool? IsActive { get; set; }
        public string? ResetOtp { get; set; }
        public DateTime? OtpexpireTime { get; set; }
        public int? EmployeeId { get; set; }

        public virtual Employee? Employee { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; }
        public virtual ICollection<ProductPriceHistory> ProductPriceHistories { get; set; }
        public virtual ICollection<StockAdjustment> StockAdjustments { get; set; }
        public virtual ICollection<StockAuditRecord> StockAuditRecordAuditors { get; set; }
        public virtual ICollection<StockAuditRecord> StockAuditRecordCoAuditors { get; set; }
        public virtual ICollection<WarehouseTransfer> WarehouseTransfers { get; set; }

        public virtual ICollection<Employee> EmployeesEmployees { get; set; }
    }
}
