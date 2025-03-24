using System;
using System.Collections.Generic;

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
        public int? SupplierId { get; set; }
        public DateTime? OrderDate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }

        public virtual Supplier? Supplier { get; set; }
        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
        public virtual ICollection<PurchaseCost> PurchaseCosts { get; set; }
        public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; }
    }
}
