using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class ProductPriceHistory
    {
        public int PriceHistoryId { get; set; }
        public int ProductId { get; set; }
        public string PriceType { get; set; } = null!;
        public decimal OldPrice { get; set; }
        public decimal NewPrice { get; set; }
        public int ChangedBy { get; set; }
        public DateTime? ChangeDate { get; set; }
        public int WarehouseId { get; set; }

        public virtual Account ChangedByNavigation { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;
    }
}
