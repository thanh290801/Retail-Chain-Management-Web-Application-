namespace RCM.Backend.DTOs
{
    public class PurchaseOrderDetailDto
    {
        public int PurchaseOrdersId { get; set; }
        public DateTime OrderDate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public decimal TotalCost { get; set; }

        public SupplierDto? Supplier { get; set; }
        public BranchDto? Branch { get; set; }
        public List<ProductItemDto>? Items { get; set; }
    }

    public class SupplierDTO
    {
        public string? Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }

    public class BranchDto
    {
        public int BranchId { get; set; }
        public string? Name { get; set; }
    }

    public class ProductItemDto
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int QuantityOrdered { get; set; }
        public decimal PurchasePrice { get; set; }
    }
}
