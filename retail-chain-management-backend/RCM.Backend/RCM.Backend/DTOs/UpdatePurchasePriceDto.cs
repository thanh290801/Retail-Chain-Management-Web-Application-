namespace RCM.Backend.DTOs
{
    public class UpdatePurchasePriceDto
    {
        public int WarehouseId { get; set; }
        public int ProductId { get; set; }  // ID của sản phẩm cần cập nhật
        public decimal NewPrice { get; set; }  // Giá nhập mới
    }

}
