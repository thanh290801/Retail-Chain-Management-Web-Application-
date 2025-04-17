namespace RCM.Backend.DTOs
{
    public class ProductsDTO
    {
        public int ProductsId { get; set; }
        public string Name { get; set; } = null!;
        public string Barcode { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal? Weight { get; set; }
        public decimal? Volume { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
    }
}
