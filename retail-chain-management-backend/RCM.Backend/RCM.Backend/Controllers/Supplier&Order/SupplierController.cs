using Microsoft.AspNetCore.Mvc;
using RCM.Backend.Models;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;
using RCM.Backend.DTOs;
using System.Numerics;
using System.Net;
using System.Xml.Linq;

namespace RCM.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly RetailChainContext _context;

        public SupplierController(RetailChainContext context)
        {
            _context = context;
        }

        // 1️⃣ Lấy danh sách nhà cung cấp
        [HttpGet]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers
                .Select(s => new
                {
                    s.SuppliersId,
                    s.Name,
                    TaxCode = s.TaxCode ?? "", // 🟢 Tránh NULL
                    Website = s.Website ?? "", // 🟢 Nếu NULL thì thay bằng ""
                    Email = s.Email ?? "",
                    Phone = s.Phone ?? "",
                    Fax = s.Fax ?? "",
                    Address = s.Address ?? "",
                    ContactPerson = s.ContactPerson ?? "",
                    R_Phone = s.R_Phone ?? ""
                })
                .ToListAsync();

            return Ok(suppliers);
        }




        // 2️⃣ Lấy nhà cung cấp theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupplier(int id)
        {
            try
            {
                var supplier = await _context.Suppliers
                    .Where(s => s.SuppliersId == id)
                    .Select(s => new
                    {
                        s.SuppliersId,
                        Name = s.Name ?? "",  // ✅ Tránh lỗi NULL                       
                        TaxCode = s.TaxCode ?? "",
                        Website = s.Website ?? "",
                        Email = s.Email ?? "",
                        Phone = s.Phone ?? "",
                        Fax = s.Fax ?? "",
                        Address = s.Address ?? "",
                        ContactPerson = s.ContactPerson ?? "",
                        R_Phone = s.R_Phone ?? ""
                    })
                    .FirstOrDefaultAsync();

                if (supplier == null)
                {
                    return NotFound(new { message = "Không tìm thấy nhà cung cấp." });
                }

                return Ok(supplier);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Lỗi khi lấy nhà cung cấp: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi lấy nhà cung cấp.", error = ex.Message });
            }
        }


        // 3️⃣ Thêm mới nhà cung cấp
        [HttpPost]
        public async Task<IActionResult> AddSupplier([FromBody] SupplierDto supplierDto)
        {
            if (supplierDto == null)
            {
                return BadRequest(new { message = "Dữ liệu gửi lên bị NULL." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Dữ liệu không hợp lệ!", errors = ModelState });
            }

            try
            {
                var supplier = new Supplier
                {
                    Name = supplierDto.Name,
                    TaxCode = supplierDto.TaxCode,
                    Website = supplierDto.Website,
                    Email = supplierDto.Email,
                    Phone = supplierDto.Phone,
                    Fax = supplierDto.Fax,
                    Address = supplierDto.Address,
                    ContactPerson = supplierDto.ContactPerson,
                    R_Phone = supplierDto.R_Phone,
                };

                _context.Suppliers.Add(supplier);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetSupplier), new { id = supplier.SuppliersId }, supplier);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi thêm nhà cung cấp: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi server khi thêm nhà cung cấp", error = ex.Message });
            }
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] SupplierDto updatedSupplier)
        {
            if (id != updatedSupplier.SuppliersId)
            {
                return BadRequest(new { message = "ID không khớp." });
            }

            var existingSupplier = await _context.Suppliers.FindAsync(id);
            if (existingSupplier == null)
            {
                return NotFound(new { message = "Nhà cung cấp không tồn tại." });
            }

            // 🔥 Đảm bảo tất cả trường có thể NULL đều được kiểm tra
            existingSupplier.Name = updatedSupplier.Name.Trim();
            existingSupplier.TaxCode = updatedSupplier.TaxCode ?? "";
            existingSupplier.Website = updatedSupplier.Website ?? "";
            existingSupplier.Email = updatedSupplier.Email ?? "";
            existingSupplier.Phone = updatedSupplier.Phone ?? "";
            existingSupplier.Fax = updatedSupplier.Fax ?? "";
            existingSupplier.Address = updatedSupplier.Address ?? "Không có địa chỉ";
            existingSupplier.ContactPerson = updatedSupplier.ContactPerson ?? "";
            existingSupplier.R_Phone = updatedSupplier.R_Phone ?? ""; // 🔥 Đảm bảo không NULL

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật thành công!", supplier = existingSupplier });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server khi cập nhật nhà cung cấp", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return NotFound();
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("GetProductsBySupplier/{supplierId}")]
        public async Task<IActionResult> GetProductsBySupplier(int supplierId)
        {
            var products = await (from sp in _context.SupplierProducts
                                  join p in _context.Products on sp.ProductId equals p.ProductsId
                                  where sp.SupplierId == supplierId
                                  select new SupplierProductDto
                                  {
                                      ProductsId = p.ProductsId,
                                      Name = p.Name,
                                      Barcode = p.Barcode,
                                      Unit = p.Unit,  // 🟢 Lấy đơn vị sản phẩm
                                      Weight = p.Weight,
                                      Category = p.Category, // 👈 thêm dòng này
                                      Volume = p.Volume,
                                      ImageUrl = p.ImageUrl ?? ""
                                  }).ToListAsync();

            return Ok(products);
        }
        // Lấy danh sách sản phẩm chưa thuộc nhà cung cấp
        [HttpGet("GetUnlinkedProducts/{supplierId}")]
        public async Task<IActionResult> GetUnlinkedProducts(int supplierId)
        {
            try
            {
                var linkedProductIds = await _context.SupplierProducts
                    .Where(sp => sp.SupplierId == supplierId)
                    .Select(sp => sp.ProductId)
                    .ToListAsync();

                var unlinked = await _context.Products
                    .Where(p => !linkedProductIds.Contains(p.ProductsId))
                    .Select(p => new
                    {
                        p.ProductsId,
                        p.Name,
                        p.Unit,
                        p.Barcode,
                        ImageUrl = string.IsNullOrEmpty(p.ImageUrl)
                            ? "https://via.placeholder.com/80x80?text=No+Image"
                            : p.ImageUrl
                    })
                    .ToListAsync();

                return Ok(unlinked);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server khi lấy sản phẩm chưa liên kết", error = ex.Message });
            }
        }


        // Thêm sản phẩm vào nhà cung cấp
        [HttpPost("AddProductsToSupplier")]
        public async Task<IActionResult> AddProductsToSupplier([FromBody] AddProductsDto dto)
        {
            if (dto.ProductIds == null || dto.ProductIds.Count == 0)
                return BadRequest("Không có sản phẩm nào được chọn.");

            foreach (var productId in dto.ProductIds)
            {
                _context.SupplierProducts.Add(new SupplierProduct
                {
                    SupplierId = dto.SupplierId,
                    ProductId = productId
                });
            }

            await _context.SaveChangesAsync();
            return Ok("Đã thêm sản phẩm vào nhà cung cấp.");
        }

        public class AddProductsDto
        {
            public int SupplierId { get; set; }
            public List<int> ProductIds { get; set; }
        }
        [HttpDelete("RemoveProductFromSupplier")]
        public async Task<IActionResult> RemoveProductFromSupplier(int supplierId, int productId)
        {
            var link = await _context.SupplierProducts
                .FirstOrDefaultAsync(sp => sp.SupplierId == supplierId && sp.ProductId == productId);

            if (link == null)
            {
                return NotFound(new { message = "Không tìm thấy liên kết sản phẩm với nhà cung cấp." });
            }

            _context.SupplierProducts.Remove(link);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa sản phẩm khỏi nhà cung cấp." });
        }


    }
}
