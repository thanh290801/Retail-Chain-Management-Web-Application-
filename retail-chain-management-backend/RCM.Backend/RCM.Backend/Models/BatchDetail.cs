﻿using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class BatchDetail
    {
        public int BatchDetailsId { get; set; }
        public int BatchId { get; set; }
        public int ProductId { get; set; }
        public int? PurchaseOrderId { get; set; }
        public int Quantity { get; set; }

        public virtual Batch Batch { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
        public virtual PurchaseOrder? PurchaseOrder { get; set; }
    }
}
