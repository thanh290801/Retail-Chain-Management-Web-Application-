using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
    public class Product
    {
        [Key]
        public int ProductsId { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Barcode { get; set; }

        public string Unit { get; set; }
        public decimal? Weight { get; set; }
        public decimal? Volume { get; set; }

        [Column("image_url")]
        public string? ImageUrl { get; set; }

        public string Category { get; set; }

        [Column("is_enabled")]  // Ánh xạ thuộc tính C# với tên cột chính xác trong DB
        public bool IsEnabled { get; set; } = true;
    }
}
