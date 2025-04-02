using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTOs;
using RCM.Backend.Models;

namespace RCM.Backend.Controllers.Supplier_Order
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public PurchaseOrdersController(RetailChainContext context)
        {
            _context = context;
        }

        // 📌 Lấy danh sách tất cả đơn đặt hàng
       [HttpGet]
[Produces("application/json")]
public async Task<IActionResult> GetPurchaseOrders()
{
    try
    {
        var orders = await _context.PurchaseOrders
            .Select(o => new
            {
                o.PurchaseOrdersId,
                o.OrderDate,
                o.Status,
                o.Notes,
                SupplierName = _context.Suppliers
                    .Where(s => s.SuppliersId == o.SupplierId)
                    .Select(s => s.Name)
                    .FirstOrDefault(),
                WarehouseName = _context.Warehouses
                    .Where(w => w.WarehousesId == o.WarehousesId)
                    .Select(w => w.Name)
                    .FirstOrDefault(),
                TotalCost = _context.PurchaseCosts
                    .Where(pc => pc.PurchaseOrderId == o.PurchaseOrdersId)
                    .Select(pc => pc.TotalCost)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(orders); // Đảm bảo trả về JSON
    }
    catch (Exception ex)
    {
        return StatusCode(500, "Lỗi máy chủ: " + ex.Message);
    }
}




        // 📌 Lấy đơn đặt hàng theo ID
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetPurchaseOrder(int orderId)
        {
            try
            {
                var order = await _context.PurchaseOrders
                    .Where(o => o.PurchaseOrdersId == orderId)
                    .Select(o => new
                    {
                        o.PurchaseOrdersId,
                        o.OrderDate,
                        o.Status,
                        o.Notes,
                        SupplierName = o.Supplier.Name, // Lấy từ bảng Supplier
                        TotalCost = _context.PurchaseCosts
                                    .Where(pc => pc.PurchaseOrderId == o.PurchaseOrdersId)
                                    .Select(pc => pc.TotalCost)
                                    .FirstOrDefault(),
                        Items = _context.PurchaseOrderItems
                            .Where(i => i.PurchaseOrderId == o.PurchaseOrdersId)
                            .Select(i => new
                            {
                                i.ProductId,
                                ProductName = i.Product.Name, // Lấy từ bảng Products
                                i.QuantityOrdered,
                                PurchasePrice = _context.StockLevels
                                                .Where(sl => sl.ProductId == i.ProductId)
                                                .Select(sl => sl.PurchasePrice)
                                                .FirstOrDefault() // Lấy giá nhập từ bảng stock_levels
                            }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (order == null)
                {
                    return NotFound("Không tìm thấy đơn hàng.");
                }

                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi máy chủ: " + ex.Message);
            }
        }



        // 📌 Tạo đơn đặt hàng mới
        [HttpPost("Create")]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderDto orderDto)
        {
            if (orderDto == null || orderDto.Items == null || !orderDto.Items.Any())
            {
                return BadRequest("Dữ liệu đơn hàng không hợp lệ.");
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var vietnamTime = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.UtcNow,
                        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")
                    );

                    // 1. Lưu vào purchase_orders
                    var order = new PurchaseOrder
                    {
                        SupplierId = orderDto.SupplierId,
                        WarehousesId = orderDto.BranchId,
                        OrderDate = vietnamTime,
                        Status = "Chưa nhận hàng",
                        Notes = orderDto.Notes
                    };
                    _context.PurchaseOrders.Add(order);
                    await _context.SaveChangesAsync();

                    // 2. Lưu vào purchase_order_items
                    foreach (var item in orderDto.Items)
                    {
                        _context.PurchaseOrderItems.Add(new PurchaseOrderItem
                        {
                            PurchaseOrderId = order.PurchaseOrdersId,
                            ProductId = item.ProductId,
                            QuantityOrdered = item.QuantityOrdered,
                            QuantityReceived = 0
                        });
                    }
                    await _context.SaveChangesAsync();

                    // 3. Lưu vào Purchase_Costs
                    var totalCost = orderDto.Items.Sum(i => i.QuantityOrdered * i.Price);
                    _context.PurchaseCosts.Add(new PurchaseCost
                    {
                        PurchaseOrderId = order.PurchaseOrdersId,
                        TotalCost = totalCost,
                        BranchId = orderDto.BranchId,
                        RecordedDate = vietnamTime
                    });
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return Ok(new { OrderId = order.PurchaseOrdersId });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, "Lỗi khi tạo đơn hàng: " + ex.Message);
                }
            }
        }
    

        [HttpGet("{orderId}/details")]
public async Task<IActionResult> GetPurchaseOrderDetails(int orderId)
{
    var order = await _context.PurchaseOrders.FindAsync(orderId);
    if (order == null)
        return NotFound("Không tìm thấy đơn hàng.");

    var cost = await _context.PurchaseCosts
        .FirstOrDefaultAsync(c => c.PurchaseOrderId == orderId);
    if (cost == null)
        return BadRequest("Không tìm thấy thông tin chi phí đơn hàng.");

    var supplier = await _context.Suppliers
        .FirstOrDefaultAsync(s => s.SuppliersId == order.SupplierId);

    var branch = await _context.Warehouses
        .FirstOrDefaultAsync(w => w.WarehousesId == cost.BranchId);

    // Lấy danh sách item
    var itemEntities = await _context.PurchaseOrderItems
        .Where(i => i.PurchaseOrderId == orderId)
        .ToListAsync();

    var productIds = itemEntities.Select(i => i.ProductId).ToList();

    var productDict = await _context.Products
        .Where(p => productIds.Contains(p.ProductsId))
        .ToDictionaryAsync(p => p.ProductsId);

    var stockDict = await _context.StockLevels
        .Where(s => productIds.Contains(s.ProductId) && s.WarehouseId == cost.BranchId)
        .ToDictionaryAsync(s => s.ProductId);

    // ✅ Thêm QuantityOrdered vào kết quả trả về
    var items = itemEntities.Select(i => new ProductItemDto
    {
        ProductId = i.ProductId,
        ProductName = productDict.ContainsKey(i.ProductId) ? productDict[i.ProductId].Name : null,
        QuantityOrdered = i.QuantityOrdered,
        QuantityReceived = i.QuantityReceived ?? 0, // ✅ Thêm dòng này
        PurchasePrice = stockDict.ContainsKey(i.ProductId) && stockDict[i.ProductId].PurchasePrice.HasValue
                        ? (decimal)stockDict[i.ProductId].PurchasePrice
                        : 0
    }).ToList();

    var result = new PurchaseOrderDetailDto
    {
        PurchaseOrdersId = order.PurchaseOrdersId,
        OrderDate = order.OrderDate ?? DateTime.MinValue,
        Status = order.Status,
        Notes = order.Notes,
        TotalCost = cost.TotalCost,
        Supplier = supplier == null ? null : new SupplierDto
        {
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Phone = supplier.Phone,
            Email = supplier.Email
        },
        Branch = branch == null ? null : new BranchDto
        {
            BranchId = branch.WarehousesId,
            Name = branch.Name
        },
        Items = items
    };

    return Ok(result);
}


        // Controller: PurchaseOrdersController.cs

        [HttpPut("{orderId}/items")]
        public async Task<IActionResult> UpdatePurchaseOrderItems(int orderId, [FromBody] List<PurchaseOrderItemDto> updatedItems)
        {
            var order = await _context.PurchaseOrders.FindAsync(orderId);
            if (order == null)
                return NotFound("Không tìm thấy đơn hàng.");

            if (order.Status != "Chưa nhận hàng")
                return BadRequest("Không thể cập nhật đơn hàng đã nhận hoặc đang xử lý.");

            var existingItems = await _context.PurchaseOrderItems
                .Where(i => i.PurchaseOrderId == orderId)
                .ToListAsync();

            // Xoá các item không còn tồn tại trong danh sách mới
            var newProductIds = updatedItems.Select(i => i.ProductId).ToList();
            var toRemove = existingItems.Where(e => !newProductIds.Contains(e.ProductId)).ToList();
            _context.PurchaseOrderItems.RemoveRange(toRemove);

            // Cập nhật hoặc thêm mới
            foreach (var item in updatedItems)
            {
                var existing = existingItems.FirstOrDefault(i => i.ProductId == item.ProductId);
                if (existing != null)
                {
                    existing.QuantityOrdered = item.QuantityOrdered;
                }
                else
                {
                    _context.PurchaseOrderItems.Add(new PurchaseOrderItem
                    {
                        PurchaseOrderId = orderId,
                        ProductId = item.ProductId,
                        QuantityOrdered = item.QuantityOrdered,
                        QuantityReceived = 0
                    });
                }
            }

            // Tính lại tổng tiền và cập nhật PurchaseCosts
            var branchId = await _context.PurchaseCosts
                .Where(c => c.PurchaseOrderId == orderId)
                .Select(c => c.BranchId)
                .FirstOrDefaultAsync();

            var stockPrices = await _context.StockLevels
                .Where(s => newProductIds.Contains(s.ProductId) && s.WarehouseId == branchId)
                .ToDictionaryAsync(s => s.ProductId, s => s.PurchasePrice ?? 0);

            var totalCost = updatedItems.Sum(i => i.QuantityOrdered * (stockPrices.ContainsKey(i.ProductId) ? stockPrices[i.ProductId] : 0));

            var costRecord = await _context.PurchaseCosts.FirstOrDefaultAsync(c => c.PurchaseOrderId == orderId);
            if (costRecord != null)
            {
                costRecord.TotalCost = totalCost;
                costRecord.RecordedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok("Cập nhật sản phẩm thành công.");
        }




        // 📌 Cập nhật đơn đặt hàng
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(int id, PurchaseOrder order)
        {
            if (id != order.PurchaseOrdersId)
            {
                return BadRequest();
            }

            _context.Entry(order).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.PurchaseOrders.Any(e => e.PurchaseOrdersId == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        



        // 📌 Xóa đơn đặt hàng
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchaseOrder(int id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
       

    }

     public class PurchaseOrderDto
    {
        public int SupplierId { get; set; }  // ID của nhà cung cấp
        public int BranchId { get; set; }    // ID chi nhánh đặt hàng
        public DateTime Orderdate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }   // Ghi chú đơn hàng
        public List<PurchaseOrderItemDto> Items { get; set; } = new List<PurchaseOrderItemDto>();
    }

    public class PurchaseOrderItemDto
    {
        public int ProductId { get; set; }    // ID sản phẩm
        public int QuantityOrdered { get; set; }  // Số lượng đặt
        public decimal Price { get; set; }    // Giá nhập của sản phẩm
    }

}
