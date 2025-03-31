using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using RCM.Backend.DTO;
using RCM.Backend.DTOs;
using System.Text.Json;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionController : ControllerBase
    {
        private readonly string _connectionString;

        public PromotionController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost("list")]
        public async Task<IActionResult> GetPromotionsWithDetails()
        {
            var promotions = new List<PromotionDetailDto>();

            try
            {
                using SqlConnection conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                using SqlCommand cmd = new SqlCommand("promo_GetPromotionsWithDetails", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                using SqlDataReader reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    promotions.Add(new PromotionDetailDto
                    {
                        PromotionsId = reader.GetInt32(reader.GetOrdinal("PromotionsId")),
                        PromotionName = reader.GetString(reader.GetOrdinal("PromotionName")),
                        StartDate = reader.GetDateTime(reader.GetOrdinal("StartDate")),
                        EndDate = reader.GetDateTime(reader.GetOrdinal("EndDate")),
                        DiscountPercent = reader.IsDBNull(reader.GetOrdinal("DiscountPercent")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("DiscountPercent")),
                        PromotionDescription = reader.IsDBNull(reader.GetOrdinal("PromotionDescription")) ? null : reader.GetString(reader.GetOrdinal("PromotionDescription")),
                        ProductsId = reader.GetInt32(reader.GetOrdinal("ProductsId")),
                        ProductName = reader.GetString(reader.GetOrdinal("ProductName")),
                        ProductBarcode = reader.GetString(reader.GetOrdinal("ProductBarcode")),
                        ProductUnit = reader.GetString(reader.GetOrdinal("ProductUnit")),
                        ProductWeight = reader.IsDBNull(reader.GetOrdinal("ProductWeight")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("ProductWeight")),
                        ProductVolume = reader.IsDBNull(reader.GetOrdinal("ProductVolume")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("ProductVolume")),
                        ProductImage = reader.IsDBNull(reader.GetOrdinal("ProductImage")) ? null : reader.GetString(reader.GetOrdinal("ProductImage")),
                        ProductCategory = reader.IsDBNull(reader.GetOrdinal("ProductCategory")) ? null : reader.GetString(reader.GetOrdinal("ProductCategory")),
                        ProductEnabled = reader.GetBoolean(reader.GetOrdinal("ProductEnabled")),
                        WarehousesId = reader.GetInt32(reader.GetOrdinal("WarehousesId")),
                        WarehouseName = reader.GetString(reader.GetOrdinal("WarehouseName")),
                        WarehouseAddress = reader.GetString(reader.GetOrdinal("WarehouseAddress")),
                        WarehouseCapacity = reader.GetInt32(reader.GetOrdinal("WarehouseCapacity")),

                        // Hứng dữ liệu từ stock_levels
                        StockLevelsId = reader.GetInt32(reader.GetOrdinal("Stock_levelsId")),
                      
                        PurchasePrice = reader.IsDBNull(reader.GetOrdinal("PurchasePrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("PurchasePrice")),
                        WholesalePrice = reader.IsDBNull(reader.GetOrdinal("WholesalePrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("WholesalePrice")),
                        RetailPrice = reader.IsDBNull(reader.GetOrdinal("RetailPrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("RetailPrice")),
                        StockStatus = reader.GetBoolean(reader.GetOrdinal("StockStatus")),
                    });
                }

                return Ok(promotions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy danh sách promotions: {ex.Message}");
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreatePromotions([FromBody] CreatePromotionRequest request)
        {
            if (request == null || request.Products == null || request.Products.Count == 0)
            {
                return BadRequest(new { Status = "Error", Message = "Dữ liệu không hợp lệ hoặc danh sách sản phẩm trống." });
            }

            try
            {
                using (SqlConnection connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    using (SqlCommand command = new SqlCommand("promo_CreatePromotions", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        // Thêm các tham số
                        command.Parameters.AddWithValue("@PromotionName", request.PromotionName);
                        command.Parameters.AddWithValue("@WarehouseId", request.WarehouseId);
                        command.Parameters.AddWithValue("@StartDate", request.StartDate);
                        command.Parameters.AddWithValue("@EndDate", request.EndDate);

                        // Chuyển Products thành JSON
                        string productJson = JsonSerializer.Serialize(request.Products);
                        command.Parameters.AddWithValue("@Products", productJson);
                        Console.WriteLine("JSON Sent to API:");
                        Console.WriteLine(productJson);

                        // Thực thi stored procedure
                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                string status = reader["Status"].ToString();
                                string message = reader["Message"].ToString();

                                if (status == "Success")
                                    return Ok(new { Status = status, Message = message });
                                else
                                    return StatusCode(500, new { Status = status, Message = message });
                            }
                        }
                    }
                }
                return StatusCode(500, new { Status = "Error", Message = "Không có phản hồi từ stored procedure." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Status = "Error", Message = ex.Message });
            }
        }
    }
}
