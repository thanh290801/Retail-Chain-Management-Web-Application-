using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class SalesReport
    {
        public int Id { get; set; }
        public DateTime ReportMonth { get; set; }
        public decimal TotalSales { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalSalary { get; set; }
        public decimal TotalProfit { get; set; }
        public int TotalOrders { get; set; }
    }
}
