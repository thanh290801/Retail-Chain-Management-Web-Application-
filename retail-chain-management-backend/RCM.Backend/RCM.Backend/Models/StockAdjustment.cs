using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class StockAdjustment
    {
        public StockAdjustment()
        {
            StockAdjustmentDetails = new HashSet<StockAdjustmentDetail>();
        }

        public int StockAdjustmentsId { get; set; }
        public int WarehouseId { get; set; }
        public int AuditorId { get; set; }
        public DateTime? AdjustmentDate { get; set; }
        public string? Notes { get; set; }

        public virtual Account Auditor { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;
        public virtual ICollection<StockAdjustmentDetail> StockAdjustmentDetails { get; set; }
    }
}
