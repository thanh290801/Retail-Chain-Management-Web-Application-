namespace RCM.Backend.Models
{
    public class CashHandoverRequest
    {

        public string TransactionCode { get; set; }
        public int EmployeeId { get; set; }
        public int? ReceiverId { get; set; }
        public int BranchId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; }  // "CASH_HANDOVER" hoặc "CASH_EXPENSE"
        public string Description { get; set; }
        public string CreatedBy { get; set; }
        public string PersonName { get; set; }
    }
}
