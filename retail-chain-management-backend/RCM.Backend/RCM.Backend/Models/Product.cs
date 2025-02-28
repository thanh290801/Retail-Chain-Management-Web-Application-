using System.ComponentModel.DataAnnotations;
namespace RCM.Backend.Models
;
public class Product
{
    [Key]
    public int ProductsId { get; set; }

    [Required]
    public string Name { get; set; }

    [Required]
    public string Barcode { get; set; }

    public string Unit { get; set; } // Thùng, hộp, gói...

    public string Category { get; set; } // Nhóm hàng (Ví dụ: "Mỹ phẩm", "Sữa", "Nước ngọt")

    public bool IsEnabled { get; set; } = true;
}

