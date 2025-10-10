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

        public ProductController(ProductService productService)
        {
            _productService = productService;
        }

        // 🟢 Lấy danh sách có paging, search, sort
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (entities, total) = await _productService.GetPagedAsync(search, sortBy, desc, page, pageSize);

            var data = entities.Select(c => new ProductResponseDTO
            {
                ProductId = c.ProductId,
                CategoryId = c.CategoryId,
                SupplierId = c.SupplierId,
                ProductName = c.ProductName,
                Barcode = c.Barcode,
                Price = c.Price,
                Unit = c.Unit,
                CreatedAt = c.CreatedAt,
                IsDeleted = c.IsDeleted
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
                ProductName = product.ProductName,
                Barcode = product.Barcode,
                Price = product.Price,
                Unit = product.Unit,
                CreatedAt = product.CreatedAt,
                IsDeleted = product.IsDeleted
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
                ProductName = created.ProductName,
                Barcode = created.Barcode,
                Price = created.Price,
                Unit = created.Unit,
                CreatedAt = created.CreatedAt,
                IsDeleted = created.IsDeleted
            };

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
                ProductName = updated.ProductName,
                Barcode = updated.Barcode,
                Price = updated.Price,
                Unit = updated.Unit,
                CreatedAt = updated.CreatedAt,
                IsDeleted = updated.IsDeleted
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product updated successfully.",
                Data = dto
            });
        }

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
                ProductName = deleted.ProductName,
                Barcode = deleted.Barcode,
                Price = deleted.Price,
                Unit = deleted.Unit,
                CreatedAt = deleted.CreatedAt,
                IsDeleted = deleted.IsDeleted
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
