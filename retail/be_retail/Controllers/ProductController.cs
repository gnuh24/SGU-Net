using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Authorization;
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
        private const string ProductImageRequestPath = "/images";
        private const string ProductImageDirectory = "var/image";
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const long MaxImageSize = 5 * 1024 * 1024; // 5MB

        private readonly ProductService _productService;
        private readonly InventoryService _inventoryService;
        private readonly IWebHostEnvironment _environment;

        public ProductController(ProductService productService, InventoryService inventoryService, IWebHostEnvironment environment)
        {
            _productService = productService;
            _inventoryService = inventoryService;
            _environment = environment;
        }

        // 🟢 Tìm kiếm sản phẩm theo Barcode (endpoint riêng)
        [HttpGet("barcode/{barcode}")]
        public async Task<IActionResult> GetByBarcode(string barcode)
        {
            var entities = await _productService.GetByBarcodeAsync(barcode);

            var data = new List<ProductResponseDTO>();
            foreach (var c in entities)
            {
                var currentStock = await _inventoryService.GetTotalStockAsync(c.ProductId);
                data.Add(new ProductResponseDTO
                {
                    ProductId = c.ProductId,
                    CategoryId = c.CategoryId,
                    SupplierId = c.SupplierId,
                    ProductName = c.Name,
                    Barcode = c.Barcode,
                    Image = c.Image,
                    ImageUrl = BuildImageUrl(c.Image),
                    Price = c.Price,
                    Unit = c.Unit,
                    CreatedAt = c.CreatedAt,
                    IsDeleted = c.IsDeleted,
                    CategoryName = c.Category?.Name,
                    SupplierName = c.Supplier?.Name,
                    CurrentStock = currentStock
                });
            }

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get products by barcode successfully.",
                Data = data
            });
        }

        // 🟢 Lấy danh sách sản phẩm cho Public User (không cần authentication)
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProducts(
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? supplierId = null,
            [FromQuery] string? categoryName = null,
            [FromQuery] string? supplierName = null)
        {
            // Chỉ lấy sản phẩm chưa bị xóa (isDeleted = false)
            var (entities, total) = await _productService.GetPagedAsync(
                search, sortBy, desc, page, pageSize, categoryId, supplierId, categoryName, supplierName, isDeleted: false);

            var data = new List<ProductResponseDTO>();
            foreach (var c in entities)
            {
                var currentStock = await _inventoryService.GetTotalStockAsync(c.ProductId);
                data.Add(new ProductResponseDTO
                {
                    ProductId = c.ProductId,
                    CategoryId = c.CategoryId,
                    SupplierId = c.SupplierId,
                    ProductName = c.Name,
                    Barcode = c.Barcode,
                    Image = c.Image,
                    ImageUrl = BuildImageUrl(c.Image),
                    Price = c.Price,
                    Unit = c.Unit,
                    CreatedAt = c.CreatedAt,
                    IsDeleted = c.IsDeleted,
                    CategoryName = c.Category?.Name,
                    SupplierName = c.Supplier?.Name,
                    CurrentStock = currentStock
                });
            }

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get public products successfully.",
                Data = new
                {
                    total,
                    page,
                    pageSize,
                    data
                }
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

            var data = new List<ProductResponseDTO>();
            foreach (var c in entities)
            {
                var currentStock = await _inventoryService.GetTotalStockAsync(c.ProductId);
                data.Add(new ProductResponseDTO
                {
                    ProductId = c.ProductId,
                    CategoryId = c.CategoryId,
                    SupplierId = c.SupplierId,
                    ProductName = c.Name,
                    Barcode = c.Barcode,
                    Image = c.Image,
                    ImageUrl = BuildImageUrl(c.Image),
                    Price = c.Price,
                    Unit = c.Unit,
                    CreatedAt = c.CreatedAt,
                    IsDeleted = c.IsDeleted,
                    CategoryName = c.Category?.Name,
                    SupplierName = c.Supplier?.Name,
                    CurrentStock = currentStock
                });
            }

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

        // 🟢 Lấy chi tiết sản phẩm cho Public User (không cần authentication)
        [HttpGet("public/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProductById(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null || product.IsDeleted)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Product not found.",
                    Data = null
                });
            }

            var currentStock = await _inventoryService.GetTotalStockAsync(product.ProductId);
            var dto = new ProductResponseDTO
            {
                ProductId = product.ProductId,
                CategoryId = product.CategoryId,
                SupplierId = product.SupplierId,
                ProductName = product.Name,
                Barcode = product.Barcode,
                Image = product.Image,
                ImageUrl = BuildImageUrl(product.Image),
                Price = product.Price,
                Unit = product.Unit,
                CreatedAt = product.CreatedAt,
                IsDeleted = product.IsDeleted,
                CategoryName = product.Category?.Name,
                SupplierName = product.Supplier?.Name,
                CurrentStock = currentStock
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product fetched successfully.",
                Data = dto
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

            var currentStock = await _inventoryService.GetTotalStockAsync(product.ProductId);
            var dto = new ProductResponseDTO
            {
                ProductId = product.ProductId,
                CategoryId = product.CategoryId,
                SupplierId = product.SupplierId,
                ProductName = product.Name,
                Barcode = product.Barcode,
                Image = product.Image,
                ImageUrl = BuildImageUrl(product.Image),
                Price = product.Price,
                Unit = product.Unit,
                CreatedAt = product.CreatedAt,
                IsDeleted = product.IsDeleted,
                CategoryName = product.Category?.Name,
                SupplierName = product.Supplier?.Name,
                CurrentStock = currentStock
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
        public async Task<IActionResult> Create([FromForm] ProductCreateForm form, IFormFile? imageFile)
        {
            string? imageFileName = null;

            // Xử lý upload ảnh nếu có
            if (imageFile != null)
            {
                var uploadResult = await UploadImageAsync(imageFile);
                if (!uploadResult.Success)
                {
                    return BadRequest(new ApiResponse<string>
                    {
                        Status = 400,
                        Message = uploadResult.ErrorMessage ?? "Failed to upload image.",
                        Data = null
                    });
                }
                imageFileName = uploadResult.FileName;
            }

            // Gán tên file ảnh vào form
            form.Image = imageFileName;

            var created = await _productService.CreateAsync(form);
            var currentStock = await _inventoryService.GetTotalStockAsync(created.ProductId);
            var dto = new ProductResponseDTO
            {
                ProductId = created.ProductId,
                CategoryId = created.CategoryId,
                SupplierId = created.SupplierId,
                ProductName = created.Name,
                Barcode = created.Barcode,
                Image = created.Image,
                ImageUrl = BuildImageUrl(created.Image),
                Price = created.Price,
                Unit = created.Unit,
                CreatedAt = created.CreatedAt,
                IsDeleted = created.IsDeleted,
                CategoryName = created.Category?.Name,
                SupplierName = created.Supplier?.Name,
                CurrentStock = currentStock
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
        public async Task<IActionResult> Update(int id, [FromForm] ProductUpdateForm form, IFormFile? imageFile)
        {
            // Lấy product hiện tại để biết file ảnh cũ
            var existingProduct = await _productService.GetByIdAsync(id);
            if (existingProduct == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Product not found.",
                    Data = null
                });
            }

            string? oldImageFileName = existingProduct.Image;
            string? imageFileName = oldImageFileName;

            // Xử lý upload ảnh mới nếu có
            if (imageFile != null)
            {
                var uploadResult = await UploadImageAsync(imageFile);
                if (!uploadResult.Success)
                {
                    return BadRequest(new ApiResponse<string>
                    {
                        Status = 400,
                        Message = uploadResult.ErrorMessage ?? "Failed to upload image.",
                        Data = null
                    });
                }
                imageFileName = uploadResult.FileName;

                // Xóa file ảnh cũ nếu có
                if (!string.IsNullOrWhiteSpace(oldImageFileName))
                {
                    await DeleteImageAsync(oldImageFileName);
                }
            }

            // Gán tên file ảnh vào form
            form.Image = imageFileName;

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

            var currentStock = await _inventoryService.GetTotalStockAsync(updated.ProductId);
            var dto = new ProductResponseDTO
            {
                ProductId = updated.ProductId,
                CategoryId = updated.CategoryId,
                SupplierId = updated.SupplierId,
                ProductName = updated.Name,
                Barcode = updated.Barcode,
                Image = updated.Image,
                ImageUrl = BuildImageUrl(updated.Image),
                Price = updated.Price,
                Unit = updated.Unit,
                CreatedAt = updated.CreatedAt,
                IsDeleted = updated.IsDeleted,
                CategoryName = updated.Category?.Name,
                SupplierName = updated.Supplier?.Name,
                CurrentStock = currentStock
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
            var currentStock = await _inventoryService.GetTotalStockAsync(deleted.ProductId);
            var dto = new ProductResponseDTO
            {
                ProductId = deleted.ProductId,
                CategoryId = deleted.CategoryId,
                SupplierId = deleted.SupplierId,
                ProductName = deleted.Name,
                Barcode = deleted.Barcode,
                Image = deleted.Image,
                ImageUrl = BuildImageUrl(deleted.Image),
                Price = deleted.Price,
                Unit = deleted.Unit,
                CreatedAt = deleted.CreatedAt,
                IsDeleted = deleted.IsDeleted,
                CategoryName = deleted.Category?.Name,
                SupplierName = deleted.Supplier?.Name,
                CurrentStock = currentStock
            };

            return Ok(new ApiResponse<ProductResponseDTO>
            {
                Status = 200,
                Message = "Product deleted successfully.",
                Data = dto
            });
        }

        private string? BuildImageUrl(string? imageFileName)
        {
            if (string.IsNullOrWhiteSpace(imageFileName))
            {
                return null;
            }

            var trimmedFileName = imageFileName.TrimStart('/', '\\');
            return $"{ProductImageRequestPath}/{trimmedFileName}".Replace("//", "/");
        }

        private async Task<(bool Success, string? FileName, string? ErrorMessage)> UploadImageAsync(IFormFile imageFile)
        {
            // Kiểm tra kích thước file
            if (imageFile.Length > MaxImageSize)
            {
                return (false, null, "Image size exceeds 5MB limit.");
            }

            // Kiểm tra extension
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(fileExtension))
            {
                return (false, null, $"Invalid image format. Allowed formats: {string.Join(", ", AllowedImageExtensions)}");
            }

            // Tạo tên file unique
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var imageDirectory = Path.Combine(_environment.ContentRootPath, ProductImageDirectory);
            Directory.CreateDirectory(imageDirectory);

            var filePath = Path.Combine(imageDirectory, uniqueFileName);

            // Lưu file
            try
            {
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(stream);
                }
                return (true, uniqueFileName, null);
            }
            catch (Exception ex)
            {
                return (false, null, $"Error saving image: {ex.Message}");
            }
        }

        private async Task DeleteImageAsync(string imageFileName)
        {
            if (string.IsNullOrWhiteSpace(imageFileName))
            {
                return;
            }

            try
            {
                var imageDirectory = Path.Combine(_environment.ContentRootPath, ProductImageDirectory);
                var filePath = Path.Combine(imageDirectory, imageFileName);

                if (System.IO.File.Exists(filePath))
                {
                    await Task.Run(() => System.IO.File.Delete(filePath));
                }
            }
            catch
            {
                // Ignore errors when deleting old images
            }
        }
    }
}
