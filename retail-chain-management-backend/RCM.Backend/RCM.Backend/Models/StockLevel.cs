using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class StockLevel
    {
        public int StockLevelsId { get; set; }
        public int ProductId { get; set; }
        public int WarehouseId { get; set; }
        public int Quantity { get; set; }
        public int MinQuantity { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? WholesalePrice { get; set; }
        public decimal? RetailPrice { get; set; }

        public virtual Product Product { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;
    }
}
