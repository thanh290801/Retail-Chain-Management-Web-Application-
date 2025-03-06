namespace RCM.Backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class OrderDetail
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }
    [ForeignKey("OrderId")]
    public Order Order { get; set; }

    public int ProductId { get; set; }
    [ForeignKey("ProductId")]
    public Product Product { get; set; }

    public decimal Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }
}

