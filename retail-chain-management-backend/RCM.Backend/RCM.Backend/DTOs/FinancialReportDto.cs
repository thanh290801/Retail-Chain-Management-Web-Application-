namespace RCM.Backend.DTO;
public class FinancialReportDto
{
    public string BranchName { get; set; }
    public string Address { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalCashRevenue { get; set; }
    public decimal TotalBankRevenue { get; set; }
    public decimal TotalRevenue => TotalCashRevenue + TotalBankRevenue;
    public int TotalRefunds { get; set; }
    public decimal TotalRefundAmount { get; set; }
    public List<SalaryItem> Salaries { get; set; }
    public decimal TotalSalary => Salaries.Sum(s => s.TotalIncome);
    public List<InventoryItem> Inventory { get; set; }
    public decimal EstimatedCOGS { get; set; } // Giá vốn ước tính
    public decimal GrossProfit => TotalRevenue - TotalRefundAmount - EstimatedCOGS - TotalSalary;

    public class SalaryItem
    {
        public string EmployeeName { get; set; }
        public string Position { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal Bonus { get; set; }
        public decimal TotalIncome => BaseSalary + Bonus;
    }

    public class InventoryItem
    {
        public string ProductName { get; set; }
        public string Unit { get; set; }
        public int Beginning { get; set; }
        public int Purchased { get; set; }
        public int Sold { get; set; }
        public int Ending => Beginning + Purchased - Sold;
    }
}
