namespace RCM.Backend.Models
{
    public class SalesFilterRequest
    {
        public int? ProductId { get; set; } // Lọc theo Mặt hàng (Có thể rỗng)
        public List<int> WarehouseIds { get; set; } // Lọc theo Chi nhánh (Có thể chọn nhiều)
        public string Category { get; set; } // Lọc theo Nhóm hàng
    }

}
