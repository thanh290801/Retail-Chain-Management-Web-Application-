using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class AttendanceRecord
    {
        public int AttendanceRecordsId { get; set; }
        public int EmployeeId { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }

        public virtual Employee Employee { get; set; } = null!;
    }
}
