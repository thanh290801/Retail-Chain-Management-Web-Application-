namespace RCM.Backend.DTOs
{
    public class OrderSearchRequest
    {
        public int? OrderId { get; set; }
        public int? EmployeeId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? WarehouseId { get; set; }
        public string? Barcode { get; set; }
        public string? ProductName { get; set; }
    }

}
