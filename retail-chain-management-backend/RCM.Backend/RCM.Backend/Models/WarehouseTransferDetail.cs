using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class WarehouseTransferDetail
    {
        public int TransferDetailId { get; set; }
        public int TransferId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }

        public virtual Product Product { get; set; } = null!;
        public virtual WarehouseTransfer Transfer { get; set; } = null!;
    }
}
