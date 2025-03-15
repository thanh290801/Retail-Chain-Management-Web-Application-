
using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Product
    {
        public Product()
        {
            BatchDetails = new HashSet<BatchDetail>();
            OrderDetails = new HashSet<OrderDetail>();
            ProductPriceHistories = new HashSet<ProductPriceHistory>();
            Promotions = new HashSet<Promotion>();
            PurchaseOrderItems = new HashSet<PurchaseOrderItem>();
            StockAdjustmentDetails = new HashSet<StockAdjustmentDetail>();
            StockAuditDetails = new HashSet<StockAuditDetail>();
            StockLevels = new HashSet<StockLevel>();
            SupplierProducts = new HashSet<SupplierProduct>();
            WarehouseTransferDetails = new HashSet<WarehouseTransferDetail>();
        }

        public int ProductsId { get; set; }
        public string Name { get; set; } = null!;
        public string Barcode { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal? Weight { get; set; }
        public decimal? Volume { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
        public bool IsEnabled { get; set; }

        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
        public virtual ICollection<ProductPriceHistory> ProductPriceHistories { get; set; }
        public virtual ICollection<Promotion> Promotions { get; set; }
        public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public virtual ICollection<StockAdjustmentDetail> StockAdjustmentDetails { get; set; }
        public virtual ICollection<StockAuditDetail> StockAuditDetails { get; set; }
        public virtual ICollection<StockLevel> StockLevels { get; set; }
        public virtual ICollection<SupplierProduct> SupplierProducts { get; set; }
        public virtual ICollection<WarehouseTransferDetail> WarehouseTransferDetails { get; set; }

    }
}
