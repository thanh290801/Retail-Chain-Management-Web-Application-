namespace RCM.Backend.Models
{
    public class SalesDashboardResponse
    {
        public string ProductName { get; set; }
        public string WarehouseName { get; set; }
        public string Category { get; set; }
        public decimal QuantitySold { get; set; }
        public decimal TotalSales { get; set; }
    }

}
