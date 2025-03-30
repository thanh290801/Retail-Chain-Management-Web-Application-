namespace RCM.Backend.DTOs
{
    public class ProductDTO
    {
        public int ProductsId { get; set; }
        public string ProductName { get; set; }
        public string Barcode { get; set; }
        public string ImageUrl { get; set; }
        public int WarehouseId { get; set; }
        public int StockQuantity { get; set; }
        public decimal? OriginalPrice { get; set; }
        public decimal? FinalPrice { get; set; }
        public string Category { get; set; }
        public bool IsEnabled { get; set; }

        // Thông tin khuyến mãi
        public int PromotionId { get; set; }
        public string PromotionName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal DiscountPercent { get; set; }
        public string PromotionDescription { get; set; }
    }

}
