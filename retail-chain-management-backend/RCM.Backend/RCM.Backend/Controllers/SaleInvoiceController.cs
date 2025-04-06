﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;
using RCM.Backend.DTOs;

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
            public List<RefundProduct> RefundProducts { get; set; }
        }

        public class RefundProduct
        {
            public int ProductId { get; set; }
            public decimal ReturnQuantity { get; set; }
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
            var branchIdClaim = User.FindFirst("BranchId")?.Value;
            using SqlConnection conn = new SqlConnection(_connectionString);
            using SqlCommand cmd = new SqlCommand("pos_SearchProductByBarcode", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@barcode", request.Barcode);
            cmd.Parameters.AddWithValue("@warehouseId", branchIdClaim);

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
            var branchIdClaim = User.FindFirst("BranchId")?.Value;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("pos_SearchProductByName", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@query", request.Query);
                    cmd.Parameters.AddWithValue("@warehouseId", branchIdClaim);

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
            var branchIdClaim = User.FindFirst("BranchId")?.Value;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand("pos_SearchOrderToReturn", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@OrderId", request.OrderId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@EmployeeId", request.EmployeeId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@StartDate", request.StartDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@EndDate", request.EndDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@WarehouseId", branchIdClaim);
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
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            var branchIdClaim = User.FindFirst("BranchId")?.Value;

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

                        // Truyền đúng 4 tham số
                        cmd.Parameters.AddWithValue("@EmployeeId", accountIdClaim);
                        cmd.Parameters.AddWithValue("@ShopId", branchIdClaim);
                        cmd.Parameters.AddWithValue("@TotalAmount", request.TotalAmount);
                        cmd.Parameters.AddWithValue("@PaymentMethod", request.PaymentMethod);
                        cmd.Parameters.AddWithValue("@Products", JsonConvert.SerializeObject(request.Products));

                        // Thực thi Stored Procedure và đọc kết quả
                        var orderId = await cmd.ExecuteScalarAsync(); // Đọc giá trị đầu tiên từ `SELECT`

                        if (orderId == null)
                        {
                            return StatusCode(500, new { message = "Lỗi: Không thể tạo hóa đơn, kiểm tra lại dữ liệu." });
                        }

                        return Ok(new
                        {
                            message = "Hóa đơn đã được tạo thành công.",
                            orderId = Convert.ToInt32(orderId)
                        });
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
            var accountIdClaim = User.FindFirst("AccountId")?.Value;
            Console.WriteLine("📌 Dữ liệu nhận được từ FE:");
            Console.WriteLine(JsonConvert.SerializeObject(request, Formatting.Indented));

            try
            {
                if (request == null || request.RefundProducts == null || request.RefundProducts.Count == 0)
                {
                    return BadRequest(new { message = "Dữ liệu không hợp lệ, danh sách sản phẩm hoàn trả không được để trống." });
                }

                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    using (SqlCommand cmd = new SqlCommand("pos_ProcessReturn", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        // ✅ Chỉ truyền đúng 3 tham số như trong Stored Procedure
                        cmd.Parameters.AddWithValue("@OrderId", request.OrderId);
                        cmd.Parameters.AddWithValue("@EmployeeId", accountIdClaim);
                        cmd.Parameters.AddWithValue("@Products", JsonConvert.SerializeObject(request.RefundProducts));

                        await cmd.ExecuteNonQueryAsync();

                        return Ok(new { message = "Hoàn tiền thành công." });
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

        [HttpPost("listOrder")]
        public async Task<IActionResult> GetOrders(
            [FromQuery] string? paymentMethod,
            [FromQuery] int? branchId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int? orderCode,
            [FromQuery] string? productName,
            [FromQuery] string? employeeName)
        {
            var orders = new List<dynamic>();

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                using (SqlCommand cmd = new SqlCommand("pos_GetOrdersByPaymentMethod", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@PaymentMethod", string.IsNullOrEmpty(paymentMethod) ? (object)DBNull.Value : paymentMethod);
                    cmd.Parameters.AddWithValue("@BranchId", branchId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@FromDate", fromDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@ToDate", toDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@OrderCode", orderCode ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@ProductName", string.IsNullOrEmpty(productName) ? (object)DBNull.Value : productName);
                    cmd.Parameters.AddWithValue("@EmployeeName", string.IsNullOrEmpty(employeeName) ? (object)DBNull.Value : employeeName);

                    await conn.OpenAsync();

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var order = new
                            {
                                orderId = reader["OrderId"] as int? ?? 0,
                                created_date = reader["created_date"] as DateTime?,
                                shop_id = reader["shop_id"] as int? ?? 0,
                                total_amount = reader["total_amount"] as decimal? ?? 0,
                                employeeid = reader["employeeid"] as int? ?? 0,
                                employee_name = reader["employee_name"]?.ToString() ?? "Unknown",
                                product_name = reader["product_name"]?.ToString() ?? "Unknown",
                                warehouse = reader["warehouse"]?.ToString() ?? "Unknown",
                                payment_status = reader["payment_status"]?.ToString() ?? "Unknown",
                                product_id = reader["product_id"] as int? ?? 0,
                                quantity = reader["quantity"] as decimal? ?? 0,
                                unit_price = reader["unit_price"] as decimal? ?? 0,
                                total_price = reader["total_price"] as decimal? ?? 0,
                                payment_method = reader["payment_method"]?.ToString() ?? "Unknown",
                                
                            };

                            orders.Add(order);
                        }
                    }
                }

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách đơn hàng", error = ex.Message });
            }
        }
        [HttpPost("listRefund")]
        public async Task<IActionResult> GetRefundList([FromBody] RefundFilterDto filter)
        {
            var refundList = new List<dynamic>();

            try
            {
                using (var conn = new SqlConnection(_connectionString))
                using (var cmd = new SqlCommand("pos_GetRefundList", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@FromDate", filter.FromDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@ToDate", filter.ToDate ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@BranchId", filter.BranchId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@EmployeeName", string.IsNullOrEmpty(filter.EmployeeName) ? (object)DBNull.Value : filter.EmployeeName);
                    cmd.Parameters.AddWithValue("@ProductName", string.IsNullOrEmpty(filter.ProductName) ? (object)DBNull.Value : filter.ProductName);
                    cmd.Parameters.AddWithValue("@OrderId", filter.OrderId ?? (object)DBNull.Value);
                    cmd.Parameters.AddWithValue("@Page", filter.Page);
                    cmd.Parameters.AddWithValue("@Limit", filter.Limit);

                    await conn.OpenAsync();

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var item = new
                            {
                                refund_id = reader["refund_id"] as int?,
                                refund_date = reader["refund_date"] as DateTime?,
                                order_id = reader["order_id"] as int?,
                                order_date = reader["order_date"] as DateTime?,
                                shop_id = reader["shop_id"] as int?,
                                warehouse = reader["warehouse"]?.ToString(),
                                employeeid = reader["employeeid"] as int?,
                                employee_name = reader["employee_name"]?.ToString(),
                                product_id = reader["product_id"] as int?,
                                product_name = reader["product_name"]?.ToString(),
                                quantity = reader["quantity"] as decimal? ?? 0,
                                total_price = reader["total_price"] as decimal? ?? 0
                            };

                            refundList.Add(item);
                        }
                    }
                }

                return Ok(refundList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách hoàn tiền", error = ex.Message });
            }
        }
    }
}