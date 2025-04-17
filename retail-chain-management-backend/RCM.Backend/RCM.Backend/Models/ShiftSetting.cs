using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class ShiftSetting
    {
        public int Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalShifts { get; set; }
    }
}
