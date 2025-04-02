namespace RCM.Backend.DTOs
{
    public class PromotionDetailDto
    {
        public int PromotionsId { get; set; }
        public string PromotionName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? DiscountPercent { get; set; }
        public string PromotionDescription { get; set; }
        public int ProductsId { get; set; }
        public string ProductName { get; set; }
        public string ProductBarcode { get; set; }
        public string ProductUnit { get; set; }
        public decimal? ProductWeight { get; set; }
        public decimal? ProductVolume { get; set; }
        public string ProductImage { get; set; }
        public string ProductCategory { get; set; }
        public bool ProductEnabled { get; set; }
        public int WarehousesId { get; set; }
        public string WarehouseName { get; set; }
        public string WarehouseAddress { get; set; }
        public int WarehouseCapacity { get; set; }

        // Thêm thông tin từ bảng stock_levels
        public int StockLevelsId { get; set; }
        public int StockQuantity { get; set; }
        public int MinQuantity { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? WholesalePrice { get; set; }
        public decimal? RetailPrice { get; set; }
        public bool StockStatus { get; set; }
    }
}
