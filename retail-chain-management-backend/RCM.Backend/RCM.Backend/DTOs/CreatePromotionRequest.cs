namespace RCM.Backend.DTOs
{
    public class CreatePromotionRequest
    {
        public string PromotionName { get; set; }
        public int WarehouseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ProductPromotionDto> Products { get; set; }
    }
}
