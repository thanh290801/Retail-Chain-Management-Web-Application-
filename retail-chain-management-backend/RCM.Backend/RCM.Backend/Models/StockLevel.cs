using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
    [Table("stock_levels")]
    public class StockLevel
    {
        [Key]
        public int StockLevelsId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public int WarehouseId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public int MinQuantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PurchasePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? WholesalePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? RetailPrice { get; set; }

        [ForeignKey("ProductId")]
        public Product Product { get; set; }

        [ForeignKey("WarehouseId")]
        public Warehouse Warehouse { get; set; }
    }
}
