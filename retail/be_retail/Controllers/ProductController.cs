using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Api;
using be_retail.DTOs;
using be_retail.Models;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/products")]
    public class ProductController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly InventoryService _inventoryService;

        public ProductController(ProductService productService, InventoryService inventoryService)
        {
            _productService = productService;
            _inventoryService = inventoryService;
        }

        // 🟢 Tìm kiếm sản phẩm theo Barcode (endpoint riêng)
        [HttpGet("barcode/{barcode}")]
        public async Task<IActionResult> GetByBarcode(string barcode)
        {
            var entities = await _productService.GetByBarcodeAsync(barcode);

            var data = entities.Select(c => new ProductResponseDTO
            {
                ProductId = c.ProductId,
                CategoryId = c.CategoryId,
                SupplierId = c.SupplierId,
                ProductName = c.Name,
                Barcode = c.Barcode,
                Price = c.Price,
                Unit = c.Unit,
                CreatedAt = c.CreatedAt,
                IsDeleted = c.IsDeleted,
                CategoryName = c.Category?.Name,
                SupplierName = c.Supplier?.Name
            }).ToList();

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get products by barcode successfully.",
                Data = data
            });
        }

        // 🟢 Lấy danh sách có paging, search, sort
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? supplierId = null,
            [FromQuery] string? categoryName = null,
            [FromQuery] string? supplierName = null,
            [FromQuery] bool? isDeleted = null)
        {
            var (entities, total) = await _productService.GetPagedAsync(
                search, sortBy, desc, page, pageSize, categoryId, supplierId, categoryName, supplierName, isDeleted);

            var data = entities.Select(c => new ProductResponseDTO
            {
                ProductId = c.ProductId,
                CategoryId = c.CategoryId,
                SupplierId = c.SupplierId,
                ProductName = c.Name,
                Barcode = c.Barcode,
                Price = c.Price,
                Unit = c.Unit,
                CreatedAt = c.CreatedAt,
                IsDeleted = c.IsDeleted,
                CategoryName = c.Category?.Name,
                SupplierName = c.Supplier?.Name
            }).ToList();

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get products successfully.",
                Data = new
                {
                    total,
                    page,
                    pageSize,
                    data
                }
            });
        }

        // 🟢 Lấy chi tiết hàng hóa
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Product not found.",
                    Data = null
                });
            }

            var dto = new ProductResponseDTO
            {
                ProductId = product.ProductId,
                CategoryId = product.CategoryId,
                SupplierId = product.SupplierId,
                ProductName = product.Name,
                Barcode = product.Barcode,
                Price = product.Price,
                Unit = product.Unit,
                CreatedAt = product.CreatedAt,
                IsDeleted = product.IsDeleted,
                CategoryName = product.Category?.Name,
                SupplierName = product.Supplier?.Name
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product fetched successfully.",
                Data = dto
            });
        }

        // 🟢 Thêm hàng hóa mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateForm form)
        {
            var created = await _productService.CreateAsync(form);
            var dto = new ProductResponseDTO
            {
                ProductId = created.ProductId,
                CategoryId = created.CategoryId,
                SupplierId = created.SupplierId,
                ProductName = created.Name,
                Barcode = created.Barcode,
                Price = created.Price,
                Unit = created.Unit,
                CreatedAt = created.CreatedAt,
                IsDeleted = created.IsDeleted,
                CategoryName = created.Category?.Name,
                SupplierName = created.Supplier?.Name
            };

            await _inventoryService.CreateAsync(new InventoryCreateForm { ProductId = created.ProductId, Quantity = 0, CreatedAt = created.CreatedAt });

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product created successfully.",
                Data = dto
            });
        }

        // 🟢 Cập nhật hàng hóa
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateForm form)
        {
            var updated = await _productService.UpdateAsync(id, form);
            if (updated == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Product not found.",
                    Data = null
                });
            }

            var dto = new ProductResponseDTO
            {
                ProductId = updated.ProductId,
                CategoryId = updated.CategoryId,
                SupplierId = updated.SupplierId,
                ProductName = updated.Name,
                Barcode = updated.Barcode,
                Price = updated.Price,
                Unit = updated.Unit,
                CreatedAt = updated.CreatedAt,
                IsDeleted = updated.IsDeleted,
                CategoryName = updated.Category?.Name,
                SupplierName = updated.Supplier?.Name
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product updated successfully.",
                Data = dto
            });
        }

        // Các filter theo categoryId/supplierId đã được tích hợp vào GET /products

        // 🟢 Xóa hàng hóa
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _productService.DeleteAsync(id);
            if (deleted == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Product not found.",
                    Data = null
                });
            }
            var dto = new ProductResponseDTO
            {
                ProductId = deleted.ProductId,
                CategoryId = deleted.CategoryId,
                SupplierId = deleted.SupplierId,
                ProductName = deleted.Name,
                Barcode = deleted.Barcode,
                Price = deleted.Price,
                Unit = deleted.Unit,
                CreatedAt = deleted.CreatedAt,
                IsDeleted = deleted.IsDeleted,
                CategoryName = deleted.Category?.Name,
                SupplierName = deleted.Supplier?.Name
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product deleted successfully.",
                Data = dto
            });
        }
    }
}
