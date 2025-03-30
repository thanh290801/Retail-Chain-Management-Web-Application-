using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Order
    {
        public Order()
        {
            OrderDetails = new HashSet<OrderDetail>();
            Refunds = new HashSet<Refund>();
            Transactions = new HashSet<Transaction>();
        }

        public int OrderId { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ShopId { get; set; }
        public decimal TotalAmount { get; set; }
        public int Employeeid { get; set; }
        public string PaymentStatus { get; set; } = null!;

        public virtual Employee Employee { get; set; } = null!;
        public virtual Warehouse Shop { get; set; } = null!;
        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
        public virtual ICollection<Refund> Refunds { get; set; }
        public virtual ICollection<Transaction> Transactions { get; set; }
    }
}
