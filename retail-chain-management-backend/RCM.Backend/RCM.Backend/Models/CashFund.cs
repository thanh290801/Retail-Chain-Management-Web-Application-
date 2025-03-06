using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RCM.Backend.Models
{
    [Table("Cash_Fund")]
    public class CashFund
    {
        [Key]
        public int FundID { get; set; }

        [Required]
        public int BranchID { get; set; }

        [Required]
        [StringLength(50)]
        public string FundType { get; set; } // "Tiền mặt" hoặc "Ngân hàng"

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        [ForeignKey("BranchID")]
        public Warehouse Warehouse { get; set; }
    }
}
