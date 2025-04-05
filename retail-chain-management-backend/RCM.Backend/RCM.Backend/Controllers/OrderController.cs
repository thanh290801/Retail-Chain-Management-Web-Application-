using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

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
                .Include(po => po.Warehouses)
                .Include(po => po.Supplier)
                .Include(po => po.PurchaseCosts)
                .Where(po => po.Warehouses.WarehousesId == branchId)
                .Select(po => new OrderDto
                {
                    OrderId = po.PurchaseOrdersId,
                    CreatedDate = po.OrderDate ?? DateTime.MinValue,
                    WarehouseName = po.Warehouses != null ? po.Warehouses.Name : "N/A",
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
        return BadRequest("BranchId không hợp lệ.");

    var purchaseOrder = await _context.PurchaseOrders
        .Include(po => po.Warehouses)
        .Include(po => po.Supplier)
        .Include(po => po.PurchaseOrderItems).ThenInclude(poi => poi.Product)
        .Include(po => po.PurchaseCosts)
        .Include(po => po.Batches)
        .FirstOrDefaultAsync(po => po.PurchaseOrdersId == id);

    if (purchaseOrder == null)
        return NotFound("Không tìm thấy đơn hàng.");

    // ✅ Load batchDetails riêng biệt nếu auto include lỗi
    var batchDetails = await _context.BatchDetails
        .Where(bd => bd.PurchaseOrderId == id)
        .Include(bd => bd.Product)
        .ToListAsync();

    var orderDetailDto = new OrderDetailDto
    {
        OrderId = purchaseOrder.PurchaseOrdersId,
        CreatedDate = purchaseOrder.OrderDate ?? DateTime.MinValue,
        WarehouseName = purchaseOrder.Warehouses?.Name ?? "Không có thông tin",
        SupplierName = purchaseOrder.Supplier?.Name ?? "Không có nhà cung cấp",
        TotalAmount = purchaseOrder.PurchaseCosts.FirstOrDefault()?.TotalCost ?? 0,
        PaymentStatus = purchaseOrder.Status,
        Products = purchaseOrder.PurchaseOrderItems.Select(poi => new OrderProductDto
        {
            ProductId = poi.ProductId,
            ProductName = poi.Product?.Name ?? "N/A",
            Unit = poi.Product?.Unit ?? "-",
            OrderedQuantity = poi.QuantityOrdered,
            ReceivedQuantity = poi.QuantityReceived,
            PurchasePrice = poi.PurchasePrice ?? 0 // ✅ lấy trực tiếp từ purchase_order_items
        }).ToList(),
        Batches = purchaseOrder.Batches.Select(b => new BatchDto
        {
            BatchId = b.BatchesId,
            ReceivedDate = b.ReceivedDate,
            TotalPrice = b.BatchPrices ?? 0m,
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
        return NotFound("Không tìm thấy đơn hàng.");

    decimal totalReceiveCost = receiveOrderDto.Products.Sum(p => p.ReceivedQuantity * p.PurchasePrice);

    var batch = new Batch
    {
        WarehouseId = receiveOrderDto.BranchId,
        ReceivedDate = DateTime.Now,
        PurchaseOrderId = id,
        Status = "Chưa thanh toán",
        BatchPrices = totalReceiveCost
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

            var stockLevel = await _context.StockLevels
                .FirstOrDefaultAsync(sl => sl.ProductId == product.ProductId && sl.WarehouseId == receiveOrderDto.BranchId);

            if (stockLevel != null)
            {
                stockLevel.Quantity += product.ReceivedQuantity;
            }
            else
            {
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

    // Trạng thái đơn hàng
    var receivedAll = purchaseOrder.PurchaseOrderItems.All(p => p.QuantityReceived >= p.QuantityOrdered);
    purchaseOrder.Status = receivedAll ? "Đã nhận đủ hàng" : "Đã nhận một phần";

    await _context.SaveChangesAsync();

    // ✅ Gửi thông báo cho chủ
    var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.WarehousesId == receiveOrderDto.BranchId);
    var branchName = warehouse?.Name ?? "kho chưa xác định";

    var ownerAccountId = await _context.Employees
        .Where(e => e.BranchId == null && e.AccountId != null)
        .Select(e => e.AccountId.Value)
        .FirstOrDefaultAsync();

    if (ownerAccountId > 0)
    {
        string message = receivedAll
            ? $"Đơn hàng #{id} tại kho {branchName} đã nhận đủ hàng."
            : $"Đơn hàng #{id} tại kho {branchName} đã nhận một phần hàng.";

        _context.Notifications.Add(new Notification
        {
            Title = "Cập nhật đơn hàng nhập",
            Message = message,
            ReceiverAccountId = ownerAccountId,
            CreatedAt = DateTime.Now,
            IsRead = false
        });

        await _context.SaveChangesAsync();
    }

    return Ok(new
    {
        Message = "Nhận hàng thành công",
        BatchId = batch.BatchesId,
        TotalAmount = totalReceiveCost
    });
}

// ✅ API 4: Tạo đơn đặt hàng mới
[HttpPost("create")]
public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderCreateRequest request)
{
    if (request.SupplierId == 0 || request.WarehouseId == 0 || request.Items == null || !request.Items.Any())
    {
        return BadRequest("Thiếu thông tin đơn hàng.");
    }

    var now = DateTime.Now;

    // ✅ 1. Tạo đơn hàng
    var order = new PurchaseOrder
    {
        SupplierId = request.SupplierId,
        WarehousesId = request.WarehouseId,  // Kho được chọn là nơi nhận hàng
        OrderDate = now,
        Status = "chưa nhận hàng",
        Notes = request.Notes ?? ""
    };

    _context.PurchaseOrders.Add(order);
    await _context.SaveChangesAsync();
    int newOrderId = order.PurchaseOrdersId;

    // ✅ 2. Chi tiết sản phẩm
    foreach (var item in request.Items)
    {
        _context.PurchaseOrderItems.Add(new PurchaseOrderItem
        {
            PurchaseOrderId = newOrderId,
            ProductId = item.ProductId,
            QuantityOrdered = item.Quantity,
            QuantityReceived = 0
        });
    }

    // ✅ 3. Tổng tiền
    decimal totalCost = request.Items.Sum(i => i.Quantity * i.Price);

    // ✅ 4. Ghi nhận chi phí nhập hàng
    var cost = new PurchaseCost
    {
        PurchaseOrderId = newOrderId,
        TotalCost = totalCost,
        BranchId = request.WarehouseId, // ✅ Gán branchId = warehouseId
        RecordedDate = now
    };

    _context.PurchaseCosts.Add(cost);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        Message = "Tạo đơn hàng thành công",
        OrderId = newOrderId,
        Total = totalCost
    });
}

[HttpGet("{orderId}/batches")]
        public async Task<ActionResult<IEnumerable<BatchDto>>> GetBatchesByOrderId(int orderId)
        {
            var batches = await _context.Batches
                .Where(b => b.PurchaseOrderId == orderId)
                .Select(b => new BatchDto
                {
                    BatchId = b.BatchesId,
                    ReceivedDate = b.ReceivedDate,
                    TotalPrice = b.BatchPrices ?? 0m,
                    Status = b.Status
                })
                .ToListAsync();

            if (!batches.Any())
            {
                return NotFound(new { message = "Không tìm thấy batch nào cho đơn hàng này." });
            }

            return Ok(batches);
        }

         // ✅ API: Xác nhận thanh toán các batch đã chọn
      [HttpPost("{id}/confirm-payments")]
public async Task<IActionResult> ConfirmPayments(int id, [FromBody] ConfirmPaymentRequest request)
{
    if (request.BatchIds == null || !request.BatchIds.Any())
    {
        return BadRequest("Không có batch nào được chọn để thanh toán.");
    }

    // Lấy đơn hàng
    var purchaseOrder = await _context.PurchaseOrders
        .FirstOrDefaultAsync(po => po.PurchaseOrdersId == id);

    if (purchaseOrder == null)
    {
        return NotFound("Không tìm thấy đơn hàng.");
    }

    var originalOrderStatus = purchaseOrder.Status;

    // Lấy các batch được chọn
    var selectedBatches = await _context.Batches
        .Where(b => request.BatchIds.Contains(b.BatchesId) && b.PurchaseOrderId == id)
        .ToListAsync();

    if (!selectedBatches.Any())
    {
        return NotFound("Không có batch hợp lệ.");
    }

    // Tính tổng tiền thanh toán cho các batch đã chọn
    decimal totalAmount = selectedBatches.Sum(b => b.BatchPrices ?? 0m);

    // Tạo mã giao dịch
    string transactionCode = $"PO-{DateTime.Now:yyyyMMddHHmmss}";

    // Tạo bản ghi giao dịch
    var transaction = new Transaction
    {
        TransactionCode = transactionCode,
        TransactionType = "PURCHASEORDER",
        PaymentMethod = "Bank",
        Amount = totalAmount,
        TransactionDate = DateTime.Now,
        EmployeeId = 1, // Có thể lấy từ JWT sau này
        BranchId = purchaseOrder.WarehousesId ?? 0,
        OrderId = null,
        Description = "Thanh toán đơn nhập hàng"
    };

    _context.Transactions.Add(transaction);

    // Cập nhật trạng thái các batch đã chọn thành "Đã thanh toán"
    foreach (var batch in selectedBatches)
    {
        batch.Status = "Đã thanh toán";
    }

    await _context.SaveChangesAsync();

    // Kiểm tra nếu trạng thái trước khi thanh toán là "Đã nhận đủ hàng" và tất cả batch của đơn hàng đều "Đã thanh toán"
    bool allBatchesPaid = await _context.Batches
        .Where(b => b.PurchaseOrderId == id)
        .AllAsync(b => b.Status == "Đã thanh toán");

    if (originalOrderStatus == "Đã nhận đủ hàng" && allBatchesPaid)
    {
        purchaseOrder.Status = "Đã thanh toán";
        await _context.SaveChangesAsync();
    }

    return Ok(new { Message = "Xác nhận thanh toán thành công.", TransactionCode = transactionCode });
}
    // ✅ API: Lấy danh sách sản phẩm trong một batch
[HttpGet("batches/{batchId}/products")]
public async Task<IActionResult> GetProductsByBatchId(int batchId)
{
    var batchDetails = await _context.BatchDetails
        .Where(bd => bd.BatchId == batchId)
        .Include(bd => bd.Product)
        .Select(bd => new
        {
            bd.ProductId,
            ProductName = bd.Product.Name,
            bd.Quantity
        })
        .ToListAsync();

    if (!batchDetails.Any())
    {
        return NotFound(new { message = "Batch không chứa sản phẩm nào." });
    }

    return Ok(batchDetails);
}

    }

   public class PurchaseOrderCreateRequest
{
    public int SupplierId { get; set; }
    public int WarehouseId { get; set; } // dùng làm BranchId trong PurchaseCost
    public string Notes { get; set; }
    public List<PurchaseOrderItemDto> Items { get; set; }
}


public class PurchaseOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
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

    // ✅ Thêm dòng này nếu chưa có
    public List<BatchDetailDto> BatchDetails { get; set; }
}

public class BatchDetailDto
{
    public int BatchDetailId { get; set; }
    public int BatchId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
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
public class ConfirmPaymentRequest
{
    public List<int> BatchIds { get; set; }
}

}
