using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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
        [Column("batch_prices")]
        public decimal BatchPrices { get; set; }

        public string Status { get; set; } // Trạng thái (Đã thanh toán / Chưa thanh toán)
        public int? PurchaseOrderId { get; set; } // Liên kết với đơn hàng nhập
        public virtual ICollection<CashHandover> CashHandovers { get; set; }

        public virtual Warehouse Warehouse { get; set; } = null!;
        public virtual ICollection<BatchDetail> BatchDetails { get; set; }
        public virtual PurchaseOrder? PurchaseOrder { get; set; } // Tham chiếu đến đơn hàng nhập
        public virtual ICollection<CashHandover> CashHandovers { get; set; }
    }
}
