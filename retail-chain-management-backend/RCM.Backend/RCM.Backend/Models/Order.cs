using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
    [Table("Order")]
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [Required]
        public int ShopId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal FinalAmount { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentStatus { get; set; } = "Pending"; // "Paid", "Refunded"

        public int? WarehouseId { get; set; }

        [ForeignKey("WarehouseId")]
        public Warehouse Warehouse { get; set; }
    }
}
