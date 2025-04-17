using System;
using System.Collections.Generic;

namespace RCM.Backend.Models
{
    public partial class Notification
    {
        public int NotificationId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public int ReceiverAccountId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }

        public virtual Account ReceiverAccount { get; set; } = null!;
    }
}
