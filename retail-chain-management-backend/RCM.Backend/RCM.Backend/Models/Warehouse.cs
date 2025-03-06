using System.ComponentModel.DataAnnotations;
namespace RCM.Backend.Models
;
public class Warehouse
{
    [Key]
    public int WarehousesId { get; set; }

    [Required]
    public string name { get; set; }

    public string address { get; set; }

    public int capacity { get; set; }
}

