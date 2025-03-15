using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class PurchaseCost
    {
        public int CostId { get; set; }
        public int PurchaseOrderId { get; set; }
        public decimal TotalCost { get; set; }
        public int BranchId { get; set; }
        public DateTime RecordedDate { get; set; }

        public virtual Warehouse Branch { get; set; } = null!;
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    }
}
