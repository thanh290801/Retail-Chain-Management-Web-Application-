namespace RCM.Backend.DTOs
{
    public class RefundRequest
    {
        public int OrderId { get; set; }
        //public int EmployeeId { get; set; }
        public List<ProductRefund> RefundProducts { get; set; } // Danh sách sản phẩm hoàn lại
    }

    public class ProductRefund
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}