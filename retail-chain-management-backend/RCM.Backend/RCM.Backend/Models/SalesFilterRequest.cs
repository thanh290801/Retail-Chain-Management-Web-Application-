namespace RCM.Backend.Models
{
    public class SalesFilterRequest
    {
        public int? ProductId { get; set; } 
        public List<int> WarehouseIds { get; set; } 
        public string Category { get; set; } 
    }

}
