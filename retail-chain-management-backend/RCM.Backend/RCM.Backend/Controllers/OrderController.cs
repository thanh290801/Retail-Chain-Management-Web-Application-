using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RCM.Backend.Controllers
{
    [Route("api/orders")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public OrdersController(RetailChainContext context)
        {
            _context = context;
        }

        // ✅ API 1: Lấy danh sách đơn hàng theo branchId và accountId
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetPurchaseOrders([FromQuery] int branchId, [FromQuery] int accountId)
        {
            if (branchId == 0 || accountId == 0)
            {
                return BadRequest("BranchId và AccountId không hợp lệ.");
            }

            var purchaseOrders = await _context.PurchaseOrders
                .Include(po => po.Warehouse)
                .Include(po => po.Supplier)
                .Include(po => po.PurchaseCosts)
                .Where(po => po.Warehouse.WarehousesId == branchId)
                .Select(po => new OrderDto
                {
                    OrderId = po.PurchaseOrdersId,
                    CreatedDate = po.OrderDate ?? DateTime.MinValue,
                    WarehouseName = po.Warehouse != null ? po.Warehouse.Name : "N/A",
                    SupplierName = po.Supplier != null ? po.Supplier.Name : "Không có nhà cung cấp",
                    TotalAmount = po.PurchaseCosts.FirstOrDefault() != null ? po.PurchaseCosts.First().TotalCost : 0,
                    PaymentStatus = po.Status
                })
                .ToListAsync();

            return Ok(purchaseOrders);
        }

        // ✅ API 2: Lấy chi tiết đơn nhập hàng
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDetailDto>> GetPurchaseOrder(int id, [FromQuery] int branchId)
        {
            if (branchId == 0)
            {
                return BadRequest("BranchId không hợp lệ.");
            }

            var purchaseOrder = await _context.PurchaseOrders
    .Include(po => po.Warehouse) // ✅ Đảm bảo lấy Warehouse
    .Include(po => po.Supplier)  // ✅ Đảm bảo lấy Supplier
    .Include(po => po.PurchaseOrderItems)
        .ThenInclude(poi => poi.Product)
    .Include(po => po.Batches)
        .ThenInclude(b => b.BatchDetails)
    .Include(po => po.PurchaseCosts)
    .FirstOrDefaultAsync(po => po.PurchaseOrdersId == id);

if (purchaseOrder == null)
{
    return NotFound("Không tìm thấy đơn hàng.");
}

// ✅ Cập nhật để tránh null
var orderDetailDto = new OrderDetailDto
{
    OrderId = purchaseOrder.PurchaseOrdersId,
    CreatedDate = purchaseOrder.OrderDate ?? DateTime.MinValue,
    WarehouseName = purchaseOrder.Warehouse?.Name ?? "Không có thông tin",
    SupplierName = purchaseOrder.Supplier?.Name ?? "Không có nhà cung cấp",
    TotalAmount = purchaseOrder.PurchaseCosts.FirstOrDefault()?.TotalCost ?? 0,
    PaymentStatus = purchaseOrder.Status,
    Products = purchaseOrder.PurchaseOrderItems.Select(poi => new OrderProductDto
    {
        ProductId = poi.ProductId,
        ProductName = poi.Product.Name,
        Unit = poi.Product.Unit,
        OrderedQuantity = poi.QuantityOrdered,
        ReceivedQuantity = poi.QuantityReceived,
        PurchasePrice = _context.StockLevels
                        .Where(sl => sl.ProductId == poi.ProductId && sl.WarehouseId == purchaseOrder.WarehousesId)
                        .Select(sl => sl.PurchasePrice)
                        .FirstOrDefault() ?? 0,
    }).ToList(),
    Batches = purchaseOrder.Batches.Select(b => new BatchDto
    {
        BatchId = b.BatchesId,
        ReceivedDate = b.ReceivedDate,
        TotalPrice = b.BatchPrices,
        Status = b.Status
    }).ToList()
};

return Ok(orderDetailDto);
        }

        // ✅ API 3: Nhận hàng và cập nhật trạng thái đơn nhập
        [HttpPost("{id}/receive")]
public async Task<IActionResult> ReceiveOrder(int id, [FromBody] ReceiveOrderDto receiveOrderDto)
{
    var purchaseOrder = await _context.PurchaseOrders
        .Include(po => po.PurchaseOrderItems)
        .FirstOrDefaultAsync(po => po.PurchaseOrdersId == id);

    if (purchaseOrder == null)
    {
        return NotFound("Không tìm thấy đơn hàng.");
    }

    // 🔹 Tính tổng giá trị nhập hàng cho lần nhận hàng này
    decimal totalReceiveCost = receiveOrderDto.Products.Sum(p => p.ReceivedQuantity * p.PurchasePrice);

    // 🔹 Tạo một batch mới
    var batch = new Batch
    {
        WarehouseId = receiveOrderDto.BranchId,
        ReceivedDate = DateTime.Now,
        PurchaseOrderId = id,
        Status = "Chưa thanh toán",
        BatchPrices = totalReceiveCost // ✅ Gán tổng số tiền vào `branch_price`
    };

    _context.Batches.Add(batch);
    await _context.SaveChangesAsync();

    foreach (var product in receiveOrderDto.Products)
    {
        var orderItem = purchaseOrder.PurchaseOrderItems.FirstOrDefault(p => p.ProductId == product.ProductId);
        if (orderItem != null)
        {
            orderItem.QuantityReceived += product.ReceivedQuantity;

            var batchDetail = new BatchDetail
            {
                BatchId = batch.BatchesId,
                ProductId = product.ProductId,
                PurchaseOrderId = id,
                Quantity = product.ReceivedQuantity
            };

            _context.BatchDetails.Add(batchDetail);

            // ✅ Cập nhật StockLevels cho kho hàng
            var stockLevel = await _context.StockLevels
                .FirstOrDefaultAsync(sl => sl.ProductId == product.ProductId && sl.WarehouseId == receiveOrderDto.BranchId);

            if (stockLevel != null)
            {
                // 🔹 Nếu sản phẩm đã có trong kho, cập nhật số lượng tồn kho
                stockLevel.Quantity += product.ReceivedQuantity;
            }
            else
            {
                // 🔹 Nếu sản phẩm chưa có trong kho, thêm mới vào StockLevels
                _context.StockLevels.Add(new StockLevel
                {
                    ProductId = product.ProductId,
                    WarehouseId = receiveOrderDto.BranchId,
                    Quantity = product.ReceivedQuantity,
                    PurchasePrice = product.PurchasePrice
                });
            }
        }
    }

    // Cập nhật trạng thái đơn hàng
    if (purchaseOrder.PurchaseOrderItems.All(p => p.QuantityReceived >= p.QuantityOrdered))
    {
        purchaseOrder.Status = "Đã nhận đủ hàng";
    }
    else
    {
        purchaseOrder.Status = "Đã nhận một phần";
    }

    await _context.SaveChangesAsync();
    return Ok(new { Message = "Nhận hàng thành công", BatchId = batch.BatchesId, TotalAmount = totalReceiveCost });
}
    }
    // ✅ DTOs (Data Transfer Objects)
    public class OrderDto
    {
        public int OrderId { get; set; }
        public DateTime CreatedDate { get; set; }
        public string WarehouseName { get; set; }
        public string SupplierName { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; }
    }

    public class OrderDetailDto : OrderDto
    {
        public List<OrderProductDto> Products { get; set; }
        public List<BatchDto> Batches { get; set; }
    }

    public class OrderProductDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public string Unit { get; set; }
        public int OrderedQuantity { get; set; }
        public int? ReceivedQuantity { get; set; }
        public decimal PurchasePrice { get; set; }
    }

    public class ReceiveOrderDto
    {
        public int BranchId { get; set; }
        public List<ProductReceiveDto> Products { get; set; }
    }

    public class ProductReceiveDto
    {
        public int ProductId { get; set; }
        public int ReceivedQuantity { get; set; }
        public decimal PurchasePrice { get; set; }
    }

    public class BatchDto
    {
        public int BatchId { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; }
    }
}
