using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace RCM.Backend.Controllers
{
    [ApiController]
    [Route("api/sale-invoice")]
    public class SaleInvoiceController : ControllerBase
    {

        // ✅ DTO Models để nhận dữ liệu từ Body
        public class BarcodeSearchRequest
        {
            public string Barcode { get; set; }
            public int WarehouseId { get; set; }
        }

        public class ProductSearchRequest
        {
            public string Query { get; set; }
            public int WarehouseId { get; set; }
        }

        public class OrderSearchRequest
        {
            public int? OrderId { get; set; }
            public int? EmployeeId { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? EndDate { get; set; }
            public int? WarehouseId { get; set; }
            public string? Barcode { get; set; }
            public string? ProductName { get; set; }
        }

        public class OrderDetailSearchRequest
        {
            public int OrderId { get; set; }
        }

        public class OrderRequest
        {
            public int EmployeeId { get; set; }
            public int ShopId { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal Discount { get; set; }
            public decimal FinalAmount { get; set; }
            public string PaymentMethod { get; set; } = "Cash";
            public List<OrderProduct> Products { get; set; } = new List<OrderProduct>();
        }

        public class OrderProduct
        {
            public int ProductId { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }

        public class RefundRequest
        {
            public int OrderId { get; set; }
            public int EmployeeId { get; set; }
            public decimal TotalRefundAmount { get; set; } // Tổng tiền hoàn lại
            public List<ProductRefund> RefundProducts { get; set; } // Danh sách sản phẩm hoàn lại
        }

        public class ProductRefund
        {
            public int ProductId { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
        }


        private readonly string _connectionString;

        public SaleInvoiceController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        // 🔹 API Tìm kiếm sản phẩm theo mã vạch (Nhận tham số từ body)
        [HttpPost("barcode")]
        public async Task<IActionResult> GetProductByBarcode([FromBody] BarcodeSearchRequest request)
        {
            using SqlConnection conn = new SqlConnection(_connectionString);
            using SqlCommand cmd = new SqlCommand("pos_SearchProductByBarcode", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@barcode", request.Barcode);
            cmd.Parameters.AddWithValue("@warehouseId", request.WarehouseId);

            await conn.OpenAsync();
            using SqlDataReader reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var product = new
                {
                    ProductsId = reader.GetInt32("ProductsId"),
                    ProductName = reader.GetString("ProductName"),
                    Barcode = reader.GetString("barcode"),
                    ImageUrl = reader.IsDBNull("image_url") ? null : reader.GetString("image_url"),
                    WarehouseId = reader.GetInt32("warehouse_id"),
                    StockQuantity = reader.GetInt32("StockQuantity"),
                    OriginalPrice = reader.GetDecimal("OriginalPrice"),
                    FinalPrice = reader.GetDecimal("FinalPrice"),
                    Category = reader.GetString("category"),
                    IsEnabled = reader.GetBoolean("is_enabled"),

                    // Thông tin khuyến mãi
                    PromotionId = reader.IsDBNull(reader.GetOrdinal("PromotionId")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("PromotionId")),
                    PromotionName = reader.IsDBNull(reader.GetOrdinal("PromotionName")) ? null : reader.GetString(reader.GetOrdinal("PromotionName")),
                    StartDate = reader.IsDBNull(reader.GetOrdinal("start_date")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("start_date")),
                    EndDate = reader.IsDBNull(reader.GetOrdinal("end_date")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("end_date")),
                    DiscountPercent = reader.IsDBNull(reader.GetOrdinal("discount_percent")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("discount_percent")),
                    PromotionDescription = reader.IsDBNull(reader.GetOrdinal("description")) ? null : reader.GetString(reader.GetOrdinal("description"))
                };

                return Ok(product);
            }

            return NotFound(new { message = "Không tìm thấy sản phẩm" });
        }

        // 🔹 API Tìm kiếm sản phẩm theo tên (Nhận tham số từ body)
        [HttpPost("search")]
        public async Task<IActionResult> SearchProducts([FromBody] ProductSearchRequest request)
        {
            var products = new List<object>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("pos_SearchProductByName", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@query", request.Query);
                    cmd.Parameters.AddWithValue("@warehouseId", request.WarehouseId);

                    await conn.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            products.Add(new
                            {
                                ProductsId = reader.GetInt32("ProductsId"),
                                ProductName = reader.GetString("ProductName"),
                                Barcode = reader.GetString("barcode"),
                                WarehouseId = reader.GetInt32("warehouse_id"),
                                StockQuantity = reader.GetInt32("StockQuantity"),
                                OriginalPrice = reader.GetDecimal("OriginalPrice"),
                                Category = reader.GetString("category"),
                                ImageUrl = reader.IsDBNull("image_url") ? null : reader.GetString("image_url"),
                                PromotionId = reader.IsDBNull("PromotionId") ? (int?)null : reader.GetInt32("PromotionId"),
                                PromotionName = reader.IsDBNull("PromotionName") ? null : reader.GetString("PromotionName"),
                                StartDate = reader.IsDBNull("start_date") ? (DateTime?)null : reader.GetDateTime("start_date"),
                                EndDate = reader.IsDBNull("end_date") ? (DateTime?)null : reader.GetDateTime("end_date"),
                                DiscountPercent = reader.IsDBNull("discount_percent") ? (decimal?)null : reader.GetDecimal("discount_percent"),
                                PromotionDescription = reader.IsDBNull("description") ? null : reader.GetString("description"),
                                FinalPrice = reader.GetDecimal("FinalPrice")
                            });
                        }
                    }
                }
            }

            if (products.Count == 0)
                return NotFound(new { message = "Không tìm thấy sản phẩm nào phù hợp" });

            return Ok(products);
        }

        [HttpPost("order/search")]
        public async Task<IActionResult> GetOrdersWithFilters([FromBody] OrderSearchRequest request)
        {
            var orders = new List<object>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("pos_SearchOrderToReturn", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@OrderId", request.OrderId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@EmployeeId", request.EmployeeId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@StartDate", request.StartDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@EndDate", request.EndDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@WarehouseId", request.WarehouseId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Barcode", string.IsNullOrEmpty(request.Barcode) ? (object)DBNull.Value : request.Barcode);
                    cmd.Parameters.AddWithValue("@ProductName", string.IsNullOrEmpty(request.ProductName) ? (object)DBNull.Value : request.ProductName);

                    await conn.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            orders.Add(new
                            {
                                OrderId = reader.GetInt32("OrderId"),
                                OrderDate = reader.GetDateTime("OrderDate"),
                                WarehouseId = reader.GetInt32("WarehouseId"),
                                TotalAmount = reader.GetDecimal("TotalAmount"),
                                Discount = reader.GetDecimal("Discount"),
                                FinalAmount = reader.GetDecimal("FinalAmount"),
                                PaymentStatus = reader.GetString("PaymentStatus"),
                                EmployeeId = reader.GetInt32("EmployeeID"),
                                EmployeeName = reader.GetString("EmployeeName"),
                                EmployeePhone = reader.GetString("EmployeePhone")
                            });
                        }
                    }
                }
            }

            if (orders.Count == 0)
                return NotFound(new { message = "Không tìm thấy hóa đơn nào phù hợp" });

            return Ok(orders);
        }

        [HttpPost("orderdetails/search")]
        public async Task<IActionResult> GetOrderDetailsByOrderId([FromBody] OrderDetailSearchRequest request)
        {
            var orderDetails = new List<object>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("sp_GetOrderDetailsByOrderId", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@OrderId", request.OrderId);

                    await conn.OpenAsync();
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            orderDetails.Add(new
                            {
                                OrderDetailId = reader.GetInt32("OrderDetailId"),
                                OrderId = reader.GetInt32("OrderId"),
                                ProductId = reader.GetInt32("ProductId"),
                                ImageUrl = reader.IsDBNull("image_url") ? null : reader.GetString("image_url"),
                                ProductName = reader.GetString("name"),
                                Barcode = reader.GetString("Barcode"),
                                Quantity = reader.GetDecimal("Quantity"),
                                UnitPrice = reader.GetDecimal("UnitPrice"),
                                TotalPrice = reader.GetDecimal("TotalPrice")
                            });
                        }
                    }
                }
            }

            if (orderDetails.Count == 0)
                return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng nào" });

            return Ok(orderDetails);
        }

        //Tạo order mới
        [HttpPost("order/create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderRequest request)
        {
            try
            {
                if (request == null || request.Products == null || request.Products.Count == 0)
                {
                    return BadRequest(new { message = "Dữ liệu không hợp lệ, danh sách sản phẩm không được để trống." });
                }

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    using (SqlCommand cmd = new SqlCommand("pos_CreateOrder", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@EmployeeId", request.EmployeeId);
                        cmd.Parameters.AddWithValue("@ShopId", request.ShopId);
                        cmd.Parameters.AddWithValue("@TotalAmount", request.TotalAmount);
                        cmd.Parameters.AddWithValue("@Discount", request.Discount);
                        cmd.Parameters.AddWithValue("@FinalAmount", request.FinalAmount);
                        cmd.Parameters.AddWithValue("@PaymentMethod", request.PaymentMethod);
                        cmd.Parameters.AddWithValue("@Products", JsonConvert.SerializeObject(request.Products));

                        // Thêm tham số output để lấy OrderId
                        SqlParameter outputParam = new SqlParameter("@NewOrderId", SqlDbType.Int)
                        {
                            Direction = ParameterDirection.Output
                        };
                        cmd.Parameters.Add(outputParam);

                        await cmd.ExecuteNonQueryAsync();

                        // Lấy OrderId từ SP
                        int newOrderId = (int)outputParam.Value;
                        return Ok(new { orderId = newOrderId, message = "Hóa đơn đã được tạo thành công." });
                    }
                }
            }
            catch (SqlException sqlEx)
            {
                return StatusCode(500, new { message = "Lỗi SQL khi tạo hóa đơn", error = sqlEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi tạo hóa đơn", error = ex.Message });
            }
        }

        //Tạo refund
        [HttpPost("order/refund")]
        public async Task<IActionResult> RefundOrder([FromBody] RefundRequest request)
        {
            try
            {
                if (request == null || request.RefundProducts == null || request.RefundProducts.Count == 0)
                {
                    return BadRequest(new { message = "Dữ liệu không hợp lệ, danh sách sản phẩm hoàn trả không được để trống." });
                }

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    using (SqlCommand cmd = new SqlCommand("pos_RefundOrder", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@OrderId", request.OrderId);
                        cmd.Parameters.AddWithValue("@EmployeeId", request.EmployeeId);
                        cmd.Parameters.AddWithValue("@TotalRefundAmount", request.TotalRefundAmount);
                        cmd.Parameters.AddWithValue("@RefundProducts", JsonConvert.SerializeObject(request.RefundProducts));

                        // Thêm tham số output để lấy RefundId
                        SqlParameter outputParam = new SqlParameter("@NewRefundId", SqlDbType.Int)
                        {
                            Direction = ParameterDirection.Output
                        };
                        cmd.Parameters.Add(outputParam);

                        await cmd.ExecuteNonQueryAsync();

                        // Lấy RefundId từ SP
                        int newRefundId = (int)outputParam.Value;
                        return Ok(new { refundId = newRefundId, message = "Hoàn tiền thành công." });
                    }
                }
            }
            catch (SqlException sqlEx)
            {
                return StatusCode(500, new { message = "Lỗi SQL khi hoàn tiền", error = sqlEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi hoàn tiền", error = ex.Message });
            }
        }
    }

}
