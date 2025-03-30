using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class WarehouseTransfer
    {
        public WarehouseTransfer()
        {
            WarehouseTransferDetails = new HashSet<WarehouseTransferDetail>();
        }

        public int TransferId { get; set; }
        public int FromWarehouseId { get; set; }
        public int ToWarehouseId { get; set; }
        public DateTime? TransferDate { get; set; }
        public int CreatedBy { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }

        public virtual Account CreatedByNavigation { get; set; } = null!;
        public virtual Warehouse FromWarehouse { get; set; } = null!;
        public virtual Warehouse ToWarehouse { get; set; } = null!;
        public virtual ICollection<WarehouseTransferDetail> WarehouseTransferDetails { get; set; }
    }
}
