namespace RCM.Backend.DTOs
{
    public class PayOSPaymentNotification
    {
        public string TransactionId { get; set; }
        public long Amount { get; set; }
        public string Description { get; set; }
        public string CustomerName { get; set; }
    }
}
