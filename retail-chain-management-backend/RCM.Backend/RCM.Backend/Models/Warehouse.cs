using System.ComponentModel.DataAnnotations;
namespace RCM.Backend.Models
;
public class Warehouse
{
    [Key]
    public int WarehousesId { get; set; }

    [Required]
    public string Name { get; set; }

    public string Address { get; set; }

    public int Capacity { get; set; }
}

