using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RCM.Backend.Models
{
    public partial class PurchaseOrder
    {
        public PurchaseOrder()
        {
            BatchDetails = new HashSet<BatchDetail>();
            PurchaseCosts = new HashSet<PurchaseCost>();
            PurchaseOrderItems = new HashSet<PurchaseOrderItem>();
        }

        public int PurchaseOrdersId { get; set; }
        [Column("supplier_id")]  // Đảm bảo ánh xạ đúng tên cột trong DB
public int SupplierId { get; set; }

      
        public int? WarehousesId { get; set; } // 🔹 Thêm trường mới

        public DateTime? OrderDate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }

        public virtual Supplier? Supplier { get; set; }
        public virtual Warehouse? Warehouse { get; set; } // 🔹 Thêm navigation property

        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
        public virtual ICollection<PurchaseCost> PurchaseCosts { get; set; }
        public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        [JsonIgnore]  // 🚀 Bỏ vòng lặp khi serialize
        public virtual ICollection<Batch> Batches { get; set; } // Thêm liên kết đến Batch
        
    }
}
