using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly RCMDbContext _context;

    public SalesController(RCMDbContext context)
    {
        _context = context;
    }

    [HttpPost("dashboard")]
    public IActionResult GetSalesDashboard([FromBody] SalesFilterRequest request)
    {
        var productId = request.ProductId ?? (object)DBNull.Value;
        var warehouseIds = request.WarehouseIds != null ? string.Join(",", request.WarehouseIds) : (object)DBNull.Value;
        var category = request.Category ?? (object)DBNull.Value;

        var query = _context.Products
            .FromSqlRaw(@"
                DECLARE @ProductId INT = {0};
                DECLARE @WarehouseIds NVARCHAR(MAX) = {1};
                DECLARE @Category NVARCHAR(255) = {2};

                SELECT 
                    p.name AS ProductName,
                    w.name AS WarehouseName,
                    p.category AS Category,
                    SUM(od.quantity) AS QuantitySold,
                    SUM(od.total_price) AS TotalSales
                FROM [Order] o
                JOIN [OrderDetail] od ON o.OrderId = od.order_id
                JOIN stock_levels sl ON od.product_id = sl.Stock_levelsId
                JOIN products p ON sl.product_id = p.ProductsId
                JOIN warehouses w ON sl.warehouse_id = w.WarehousesId
                WHERE 
                    (@ProductId IS NULL OR p.ProductsId = @ProductId) AND
                    (@WarehouseIds IS NULL OR w.WarehousesId IN (SELECT value FROM STRING_SPLIT(@WarehouseIds, ','))) AND
                    (@Category IS NULL OR p.category = @Category)
                GROUP BY p.name, w.name, p.category;
            ", productId, warehouseIds, category)
            .ToList();

        return Ok(query);
    }
}

public class SalesFilterRequest
{
    public int? ProductId { get; set; }
    public List<int> WarehouseIds { get; set; }
    public string Category { get; set; }
}
