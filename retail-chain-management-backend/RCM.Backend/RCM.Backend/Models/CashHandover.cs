using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
    [Table("Cash_Handover")]
    public class CashHandover
    {
        [Key]
        public int HandoverID { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [Required]
        public int EmployeeID { get; set; } // Nhân viên thực hiện bàn giao

        [Required]
        public int ReceiverID { get; set; } // Nhân viên nhận tiền

        [Required]
        public int BranchID { get; set; } // Chi nhánh thực hiện bàn giao

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } // Số tiền bàn giao

        [Required]
        [MaxLength(50)]
        public string TransactionType { get; set; } // "Thu" hoặc "Chi"

        [MaxLength(255)]
        public string Description { get; set; } // Ghi chú hoặc mô tả

        [Required]
        public int CreatedBy { get; set; } // Người tạo phiếu bàn giao

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? PersonName { get; set; } // Tên người nhận nếu có

        [MaxLength(500)]
        public string? Note { get; set; } // Ghi chú bổ sung
        [Required]
       
        public virtual Employee Employee { get; set; }
        public virtual Employee Receiver { get; set; }
        public virtual Batch Branch { get; set; }
    }
}
