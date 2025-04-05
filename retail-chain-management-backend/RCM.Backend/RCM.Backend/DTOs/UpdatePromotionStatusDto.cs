namespace RCM.Backend.DTOs
{
    public class UpdatePromotionStatusDto
    {
        public int PromotionId { get; set; }
        public string Action { get; set; } // 'end_now' hoặc 'cancel'
    }
}
