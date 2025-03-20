using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Collections.Generic;
using RCM.Backend.Models;

[Route("api/stock-check")]
[ApiController]
public class StockCheckController : ControllerBase
{
    private readonly RetailChainContext _context;

    public StockCheckController(RetailChainContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách nhân viên trong kho dựa vào BranchID từ token
    /// </summary>
    [HttpGet("employees/{branchId}")]
    public IActionResult GetEmployeesByBranch(int branchId)
    {
        var employees = _context.Employees
            .Where(e => e.BranchId == branchId)
            .Select(e => new { e.EmployeeId, e.FullName })
            .ToList();

        return Ok(employees);
    }

    /// <summary>
    /// Lấy danh sách sản phẩm trong kho
    /// </summary>
    [HttpGet("products/{warehouseId}")]
    public IActionResult GetProductsByWarehouse(int warehouseId)
    {
        var products = _context.StockLevels
            .Where(s => s.WarehouseId == warehouseId)
            .Join(_context.Products,
                  s => s.ProductId,
                  p => p.ProductsId,
                  (s, p) => new
                  {
                      p.ProductsId,
                      p.Name,
                      p.Unit,
                      s.Quantity,
                      s.MinQuantity
                  })
            .ToList();

        return Ok(products);
    }

    /// <summary>
    /// Tạo phiếu kiểm kho và cập nhật số lượng tồn kho nếu có sai lệch
    /// </summary>
   [HttpPost("create")]
public IActionResult CreateStockAudit([FromBody] StockAuditRequest request)
{
    if (request == null || request.Products == null || request.Products.Count == 0)
    {
        return BadRequest("Dữ liệu không hợp lệ.");
    }

    using (var transaction = _context.Database.BeginTransaction())
    {
        try
        {
            // 🔹 Tạo phiếu kiểm kho
            var auditRecord = new StockAuditRecord
            {
                WarehouseId = request.WarehouseId,
                AuditorId = request.AuditorId,
                CoAuditorId = request.CoAuditorId,
                AuditDate = DateTime.UtcNow
            };
            _context.StockAuditRecords.Add(auditRecord);
            _context.SaveChanges(); // 🔥 Lưu ngay để lấy ID

            var auditDetails = new List<StockAuditDetail>();
            var adjustmentDetails = new List<StockAdjustmentDetail>();

            // 🔹 Kiểm tra sản phẩm và cập nhật tồn kho
            foreach (var item in request.Products)
            {
                var stock = _context.StockLevels
                    .FirstOrDefault(s => s.WarehouseId == request.WarehouseId && s.ProductId == item.ProductId);
                
                if (stock == null) continue;

                auditDetails.Add(new StockAuditDetail
                {
                    AuditId = auditRecord.StockAuditRecordsId,
                    ProductId = item.ProductId,
                    RecordedQuantity = item.RecordedQuantity
                });

                // Nếu số lượng thực tế khác số lượng hệ thống, tạo phiếu điều chỉnh
                if (stock.Quantity != item.RecordedQuantity)
                {
                    // 🔥 Kiểm tra xem đã có phiếu điều chỉnh cho kho này chưa
                    var adjustment = _context.StockAdjustments
                        .FirstOrDefault(a => a.WarehouseId == request.WarehouseId && a.AuditorId == request.AuditorId);
                    
                    if (adjustment == null)
                    {
                        // 🔹 Tạo phiếu điều chỉnh số lượng
adjustment = new StockAdjustment
{
    WarehouseId = request.WarehouseId,
    AuditorId = request.AuditorId,
    AdjustmentDate = DateTime.UtcNow,
    Notes = "Sai lệch kiểm kho"
};

// 🔹 Lưu vào database để nhận ID mới
_context.StockAdjustments.Add(adjustment);
_context.SaveChanges();
Console.WriteLine($"✅ StockAdjustment Created - ID: {adjustment.StockAdjustmentsId}");

// 🛠 Kiểm tra nếu ID vẫn null
if (adjustment.StockAdjustmentsId == 0)
{
    return StatusCode(500, new { message = "Lỗi khi lấy ID phiếu điều chỉnh từ database." });
}

                    }

                    // 🔹 Lưu vào `stock_adjustment_details`
                    adjustmentDetails.Add(new StockAdjustmentDetail
                    {
                        AdjustmentId = adjustment.StockAdjustmentsId,
                        ProductId = item.ProductId,
                        PreviousQuantity = stock.Quantity,
                        AdjustedQuantity = item.RecordedQuantity,
                        Reason = "Sai lệch kiểm kho"
                    });

                    // 🔹 Cập nhật lại số lượng tồn kho
                    stock.Quantity = item.RecordedQuantity;
                }
            }

            // 🔹 Lưu danh sách vào bảng
            _context.StockAuditDetails.AddRange(auditDetails);
            _context.StockAdjustmentDetails.AddRange(adjustmentDetails);
            _context.SaveChanges();

            transaction.Commit();
            
            return Ok(new 
{ 
    message = "Phiếu kiểm kho đã được tạo thành công.", 
    stockAuditRecordsId = auditRecord.StockAuditRecordsId,
    stockAdjustmentsId = adjustmentDetails.Any() ? (int?)adjustmentDetails.First().AdjustmentId : null,
    adjustedProductCount = adjustmentDetails.Count 
});

        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return StatusCode(500, new { message = "Lỗi khi lưu dữ liệu.", error = ex.InnerException?.Message ?? ex.Message });
        }
    }
}

/// <summary>
/// Lưu điều chỉnh số lượng từ phiếu kiểm kho
/// </summary>
[HttpPut("adjustments/update")]
public IActionResult UpdateStockAdjustments([FromBody] StockAdjustmentRequest request)
{
    if (request == null || request.Products == null || request.Products.Count == 0)
    {
        return BadRequest(new { message = "Dữ liệu không hợp lệ.", error = "Payload trống hoặc không có sản phẩm." });
    }

    using (var transaction = _context.Database.BeginTransaction())
    {
        try
        {
            Console.WriteLine("📥 Nhận dữ liệu từ FE: " + Newtonsoft.Json.JsonConvert.SerializeObject(request));

            // 🔍 Kiểm tra xem phiếu điều chỉnh có tồn tại không
            var adjustment = _context.StockAdjustments
                .FirstOrDefault(a => a.StockAdjustmentsId == request.AdjustmentId);

            if (adjustment == null)
            {
                return NotFound(new { message = "Không tìm thấy phiếu điều chỉnh." });
            }

            // ✅ Cập nhật thông tin chung của phiếu điều chỉnh
            adjustment.Notes = "Điều chỉnh do kiểm kê";
            adjustment.AdjustmentDate = DateTime.UtcNow;

            // ✅ Duyệt qua từng sản phẩm và cập nhật
            foreach (var item in request.Products)
            {
                var detail = _context.StockAdjustmentDetails
                    .FirstOrDefault(d => d.AdjustmentId == request.AdjustmentId && d.ProductId == item.ProductId);

                if (detail != null)
                {
                    // 🔹 Nếu đã có -> Cập nhật
                    detail.PreviousQuantity = item.PreviousQuantity;
                    detail.AdjustedQuantity = item.AdjustedQuantity;
                    detail.Reason = string.IsNullOrWhiteSpace(item.Reason) ? "Sai lệch kiểm kho" : item.Reason;
                }
            }

            // ✅ Lưu thay đổi
            _context.SaveChanges();
            transaction.Commit();

            return Ok(new { message = "Phiếu điều chỉnh đã được cập nhật thành công." });
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return StatusCode(500, new { message = "Lỗi khi cập nhật điều chỉnh số lượng.", error = ex.Message });
        }
    }
}


/// <summary>
/// Lấy danh sách sản phẩm có điều chỉnh số lượng từ một phiếu kiểm kho
/// </summary>
[HttpGet("adjustments/{adjustmentId}")]
public IActionResult GetStockAdjustmentDetails(int adjustmentId)
{
    var adjustment = _context.StockAdjustments
        .Where(a => a.StockAdjustmentsId == adjustmentId)
        .Select(a => new
        {
            a.StockAdjustmentsId,
            a.WarehouseId,
            a.AuditorId,
            a.AdjustmentDate,
            a.Notes,
            Products = _context.StockAdjustmentDetails
                .Where(d => d.AdjustmentId == adjustmentId)
                .Join(_context.Products,
                      d => d.ProductId,
                      p => p.ProductsId,
                      (d, p) => new
                      {
                          d.ProductId,
                          ProductName = p.Name,
                          d.PreviousQuantity,
                          d.AdjustedQuantity,
                          d.Reason
                      })
                .ToList()
        })
        .FirstOrDefault();

    if (adjustment == null)
    {
        return NotFound("Không tìm thấy phiếu điều chỉnh.");
    }

    return Ok(new
{
    StockAdjustmentsId = adjustment.StockAdjustmentsId,
    WarehouseId = adjustment.WarehouseId,
    AuditorId = adjustment.AuditorId,
    AdjustmentDate = adjustment.AdjustmentDate,
    Notes = adjustment.Notes,
    Products = _context.StockAdjustmentDetails
        .Where(d => d.AdjustmentId == adjustmentId)
        .Join(_context.Products,
              d => d.ProductId,
              p => p.ProductsId,
              (d, p) => new
              {
                  ProductId = d.ProductId,
                  ProductName = p.Name,
                  PreviousQuantity = d.PreviousQuantity,
                  AdjustedQuantity = d.AdjustedQuantity,
                  Reason = d.Reason
              })
        .ToList()
});

}

    // **Models Request**
    public class StockAuditRequest
    {
        public int WarehouseId { get; set; }
        public int AuditorId { get; set; }
        public int? CoAuditorId { get; set; }
        public List<StockAuditDetailRequest> Products { get; set; }
    }

    public class StockAuditDetailRequest
    {
        public int ProductId { get; set; }
        public int RecordedQuantity { get; set; }
    }

    public class StockAdjustmentRequest
{
    public int AdjustmentId { get; set; } // ✅ Thêm thuộc tính này
    public int WarehouseId { get; set; }
    public int AuditorId { get; set; }
    public List<StockAdjustmentDetailRequest> Products { get; set; }
}


public class StockAdjustmentDetailRequest
{
    public int ProductId { get; set; } // ✅ Đảm bảo đây là kiểu int
    public int PreviousQuantity { get; set; }
    public int AdjustedQuantity { get; set; }
    public string Reason { get; set; }
}

}
