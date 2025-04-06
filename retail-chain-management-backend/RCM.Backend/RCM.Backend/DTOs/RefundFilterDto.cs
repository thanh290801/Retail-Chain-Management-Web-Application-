namespace RCM.Backend.DTOs
{
    public class RefundFilterDto
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? BranchId { get; set; }
        public string? EmployeeName { get; set; }
        public string? ProductName { get; set; }
        public int? OrderId { get; set; }
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 10;
    }

}
