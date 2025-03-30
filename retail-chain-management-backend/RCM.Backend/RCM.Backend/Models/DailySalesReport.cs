using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class DailySalesReport
    {
        public int ReportId { get; set; }
        public int WarehouseId { get; set; }
        public DateTime ReportDate { get; set; }
        public decimal TotalSales { get; set; }
        public int TotalOrders { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual Warehouse Warehouse { get; set; } = null!;
    }
}
