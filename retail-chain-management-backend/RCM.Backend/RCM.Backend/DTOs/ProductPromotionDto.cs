namespace RCM.Backend.DTOs
{
    public class ProductPromotionDto
    {
        public int ProductId { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Description { get; set; }
    }
}
