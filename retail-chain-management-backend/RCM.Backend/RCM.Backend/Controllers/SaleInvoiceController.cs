using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using RCM.Backend.Models;
using System.Data;

namespace RCM.Backend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SaleInvoiceController : ControllerBase
    {
        private readonly RetailChainContext _context;
        public SaleInvoiceController(RetailChainContext context)
        {
            _context = context;
        }

        //// API Tìm kiếm sản phẩm theo mã vạch
        //[HttpGet("barcode")]
        //public async Task<IActionResult> GetProductByBarcode([FromQuery] string code, [FromQuery] int warehouseId)
        //{
        //    var product = await _context.Products
        //        .FromSqlRaw("EXEC pos_SearchProductByBarcode @p0, @p1", code, warehouseId)
        //        .AsNoTracking()
        //        .FirstOrDefaultAsync();

        //    if (product == null)
        //        return NotFound(new { message = "Không tìm thấy sản phẩm" });

        //    return Ok(product);
        //}

        //// API Tìm kiếm sản phẩm theo tên (hỗ trợ gợi ý)
        //[HttpGet("search")]
        //public async Task<IActionResult> SearchProducts([FromQuery] string query, [FromQuery] int warehouseId)
        //{
        //    var products = await _context.Products
        //        .FromSqlRaw("EXEC sp_SearchProductWithPromotion @p0, @p1", query, warehouseId)
        //        .AsNoTracking()
        //        .ToListAsync();

        //    if (products == null || products.Count == 0)
        //        return NotFound(new { message = "Không tìm thấy sản phẩm nào phù hợp" });

        //    return Ok(products);
        //}


        //[HttpPost("create")]
        //public async Task<IActionResult> CreateOrder([FromBody] object orderRequest)
        //{
        //    var orderId = new SqlParameter("@OrderId", SqlDbType.Int) { Direction = ParameterDirection.Output };
        //    var warehouseId = new SqlParameter("@WarehouseId", orderRequest.WarehouseId);
        //    var itemsTable = new DataTable();
        //    itemsTable.Columns.Add("ProductId", typeof(int));
        //    itemsTable.Columns.Add("Quantity", typeof(int));

        //    foreach (var item in orderRequest.Items)
        //    {
        //        itemsTable.Rows.Add(item.ProductId, item.Quantity);
        //    }

        //    var itemsParam = new SqlParameter("@Items", SqlDbType.Structured)
        //    {
        //        TypeName = "OrderItemType",
        //        Value = itemsTable
        //    };

        //    using var command = new SqlCommand("sp_CreateOrder", connection)
        //    {
        //        CommandType = CommandType.StoredProcedure
        //    };
        //    command.Parameters.Add(warehouseId);
        //    command.Parameters.Add(itemsParam);
        //    command.Parameters.Add(orderId);

        //    await command.ExecuteNonQueryAsync();

        //    return Ok(new { message = "Đơn hàng đã tạo", orderId = orderId.Value });
        //}
    }
}
