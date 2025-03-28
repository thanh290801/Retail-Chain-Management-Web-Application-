using System.ComponentModel.DataAnnotations;

namespace RCM.Backend.DTOs
{
    public class SupplierProductDto
    {
        public int ProductsId { get; set; }
        public string Name { get; set; }
        public string Barcode { get; set; }
        public string Unit { get; set; } // 🔥 THÊM TRƯỜNG NÀY
        public decimal? Weight { get; set; }
        public decimal? Volume { get; set; }
        public string? ImageUrl { get; set; }
        
        public string? Category { get; set; }

    }
}
