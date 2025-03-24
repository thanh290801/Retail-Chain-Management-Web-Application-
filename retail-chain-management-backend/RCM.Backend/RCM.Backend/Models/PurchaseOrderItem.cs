using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class PurchaseOrderItem
    {
        public int PurchaseOrderItemsId { get; set; }
        public int PurchaseOrderId { get; set; }
        public int ProductId { get; set; }
        public int QuantityOrdered { get; set; }
        public int? QuantityReceived { get; set; }

        public virtual Product Product { get; set; } = null!;
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    }
}
