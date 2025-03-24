namespace RCM.Backend.DTOs
{
    public class PurchaseOrderDto
    {
        public int SupplierId { get; set; }  // ID của nhà cung cấp
        public int BranchId { get; set; }    // ID chi nhánh đặt hàng
        public DateTime Orderdate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }   // Ghi chú đơn hàng
        public List<PurchaseOrderItemDto> Items { get; set; } = new List<PurchaseOrderItemDto>();
    }

    public class PurchaseOrderItemDto
    {
        public int ProductId { get; set; }    // ID sản phẩm
        public int QuantityOrdered { get; set; }  // Số lượng đặt
        public decimal Price { get; set; }    // Giá nhập của sản phẩm
    }

}
