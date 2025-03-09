using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Warehouse
    {
        public Warehouse()
        {
            Batches = new HashSet<Batch>();
            DailySalesReports = new HashSet<DailySalesReport>();
            Employees = new HashSet<Employee>();
            Funds = new HashSet<Fund>();
            Orders = new HashSet<Order>();
            ProductPriceHistories = new HashSet<ProductPriceHistory>();
            Promotions = new HashSet<Promotion>();
            StockAdjustments = new HashSet<StockAdjustment>();
            StockAuditRecords = new HashSet<StockAuditRecord>();
            StockLevels = new HashSet<StockLevel>();
            WarehouseTransferFromWarehouses = new HashSet<WarehouseTransfer>();
            WarehouseTransferToWarehouses = new HashSet<WarehouseTransfer>();
        }

        public int WarehousesId { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public int Capacity { get; set; }

        public virtual ICollection<Batch> Batches { get; set; }
        public virtual ICollection<DailySalesReport> DailySalesReports { get; set; }
        public virtual ICollection<Employee> Employees { get; set; }
        public virtual ICollection<Fund> Funds { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<ProductPriceHistory> ProductPriceHistories { get; set; }
        public virtual ICollection<Promotion> Promotions { get; set; }
        public virtual ICollection<StockAdjustment> StockAdjustments { get; set; }
        public virtual ICollection<StockAuditRecord> StockAuditRecords { get; set; }
        public virtual ICollection<StockLevel> StockLevels { get; set; }
        public virtual ICollection<WarehouseTransfer> WarehouseTransferFromWarehouses { get; set; }
        public virtual ICollection<WarehouseTransfer> WarehouseTransferToWarehouses { get; set; }
    }
}
