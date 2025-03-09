using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class StockAuditRecord
    {
        public StockAuditRecord()
        {
            StockAuditDetails = new HashSet<StockAuditDetail>();
        }

        public int StockAuditRecordsId { get; set; }
        public int WarehouseId { get; set; }
        public int AuditorId { get; set; }
        public int? CoAuditorId { get; set; }
        public DateTime? AuditDate { get; set; }

        public virtual Account Auditor { get; set; } = null!;
        public virtual Account? CoAuditor { get; set; }
        public virtual Warehouse Warehouse { get; set; } = null!;
        public virtual ICollection<StockAuditDetail> StockAuditDetails { get; set; }
    }
}
