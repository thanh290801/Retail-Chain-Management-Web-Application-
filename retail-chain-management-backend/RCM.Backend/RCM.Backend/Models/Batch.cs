using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Batch
    {
        public Batch()
        {
            BatchDetails = new HashSet<BatchDetail>();
        }

        public int BatchesId { get; set; }
        public int WarehouseId { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public decimal BatchPrices { get; set; }
        public string? Status { get; set; }
        public int? PurchaseOrderId { get; set; }

        public virtual PurchaseOrder? PurchaseOrder { get; set; }
        public virtual Warehouse Warehouse { get; set; } = null!;
        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
    }
}
