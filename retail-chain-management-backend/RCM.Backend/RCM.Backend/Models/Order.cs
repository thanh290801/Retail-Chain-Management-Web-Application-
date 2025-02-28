using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace RCM.Backend.Models;

public class Order
{
    [Key]
    public int OrderId { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.Now;

    public int ShopId { get; set; }
    [ForeignKey("ShopId")]
    public Warehouse Warehouse { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal Discount { get; set; }

    public decimal FinalAmount { get; set; }

    public string PaymentStatus { get; set; } = "Pending";

    public DateTime InvoiceDate { get; set; } = DateTime.Now;

    public ICollection<OrderDetail> OrderDetails { get; set; }
}

