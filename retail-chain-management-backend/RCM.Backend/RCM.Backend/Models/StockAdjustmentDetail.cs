﻿using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class StockAdjustmentDetail
    {
        public int StockAdjustmentDetailsId { get; set; }
        public int AdjustmentId { get; set; }
        public int ProductId { get; set; }
        public int PreviousQuantity { get; set; }
        public int AdjustedQuantity { get; set; }
        public string? Reason { get; set; }

        public virtual StockAdjustment Adjustment { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}
