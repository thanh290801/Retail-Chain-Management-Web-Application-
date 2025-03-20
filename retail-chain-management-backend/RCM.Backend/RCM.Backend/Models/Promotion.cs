using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Promotion
    {
        public int PromotionsId { get; set; }
        public string Name { get; set; } = null!;
        public int ProductId { get; set; }
        public int WarehouseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? DiscountPercent { get; set; }
        public string? Description { get; set; }

        public virtual Product Product { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;
    }
}
