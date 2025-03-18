namespace RCM.Backend.DTOs
{
    public class StaffFinancialSummaryDto
    {
    
        public string EmployeeName { get; set; }     // Tên nhân viên đăng nhập
        public string BranchName { get; set; }       // Chi nhánh của nhân viên
        public decimal TotalSalesToday { get; set; } // Tổng doanh thu hôm nay
        public decimal CashSales { get; set; }       // Doanh thu tiền mặt
        public decimal BankSales { get; set; }       // Doanh thu chuyển khoản
        public decimal TotalRevenue { get; set; }    // Tổng thu (tổng doanh thu + các khoản thu khác)
        public decimal TotalExpense { get; set; }    // Tổng chi tiêu
        public decimal OpeningBalance { get; set; }  // Tồn quỹ đầu ngày
        public decimal CurrentBalance { get; set; }  // Tồn quỹ hiện tại
    }

}
