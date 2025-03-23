namespace RCM.Backend.DTOs
{
    public class ShiftDTO
    {
        public class ShiftSettingDTO
        {
            public int Month { get; set; }
            public int Year { get; set; }
            public int TotalShifts { get; set; }
        }

        // Giả định entity ShiftSetting (thêm vào RetailChainContext nếu chưa có)
        public class ShiftSetting
        {
            public int Id { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
            public int TotalShifts { get; set; } // Tổng số ca làm trong tháng
        }
        public class OvertimeRequestDTO
        {
            public int EmployeeId { get; set; }
            public DateTime Date { get; set; }
            public decimal TotalHours { get; set; }
            public string Reason { get; set; }
        }
    }
}
