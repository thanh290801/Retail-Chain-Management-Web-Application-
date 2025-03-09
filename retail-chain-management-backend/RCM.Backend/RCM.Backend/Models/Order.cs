using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Order
    {
        public Order()
        {
            FundTransactionHistories = new HashSet<FundTransactionHistory>();
            OrderDetails = new HashSet<OrderDetail>();
            Payments = new HashSet<Payment>();
            Refunds = new HashSet<Refund>();
        }

        public int OrderId { get; set; }
        public DateTime CreatedDate { get; set; }
        public int ShopId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public int Employeeid { get; set; }
        public decimal FinalAmount { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public DateTime? InvoiceDate { get; set; }

        public virtual Employee Employee { get; set; } = null!;
        public virtual Warehouse Shop { get; set; } = null!;
        public virtual ICollection<FundTransactionHistory> FundTransactionHistories { get; set; }
        public virtual ICollection<OrderDetail> OrderDetails { get; set; }
        public virtual ICollection<Payment> Payments { get; set; }
        public virtual ICollection<Refund> Refunds { get; set; }
    }
}
