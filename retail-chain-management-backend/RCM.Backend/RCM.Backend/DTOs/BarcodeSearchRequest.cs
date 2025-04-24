namespace RCM.Backend.DTOs
{
    public class BarcodeSearchRequest
    {
        public string Barcode { get; set; }
        public int WarehouseId { get; set; }
    }
}
