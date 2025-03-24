using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Batch
    {
        public Batch()
        {
            BatchDetails = new HashSet<BatchDetail>();
        }

        public int BatchesId { get; set; }
        public int WarehouseId { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public virtual ICollection<CashHandover> CashHandovers { get; set; }

        public virtual Warehouse Warehouse { get; set; } = null!;
        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
    }
}
