using be_retail.Api;
using be_retail.DTOs;
using be_retail.DTOs.Inventory;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    
    [ApiController]
    [Route("api/v1/inventories")]
    public class InventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService; 

        public InventoryController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // 🟢 Lấy danh sách tồn kho với phân trang
        [HttpGet]
        public async Task<IActionResult> GetInventories(
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
            var result = await _inventoryService.GetInventoriesAsync(page, pageSize, search, sortBy, desc, categoryId, supplierId, categoryName, supplierName);

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get inventories successfully.",
                Data = new
                {
                    total = result.Total,
                    page = result.Page,
                    pageSize = result.PageSize,
                    totalPages = result.TotalPages,
                    data = result.Data
                }
            });
        }

        // 🟢 Lấy chi tiết tồn kho theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetInventoryDetail(int id)
        {
            var result = await _inventoryService.GetInventoryDetailAsync(id);
            if (result == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Inventory record not found."
                });
            }
            return Ok(new ApiResponse<InventoryResponseDTO>
            {
                Status = 200,
                Message = "Inventory detail fetched successfully.",
                Data = result
            });
        }

        // 🟢 Lấy danh sách tồn kho theo ProductId (sắp xếp theo CreatedAt)
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetInventoriesByProductId(int productId, [FromQuery] bool desc = true)
        {
            var data = await _inventoryService.GetByProductIdAsync(productId, desc);
            if (data == null || data.Count == 0)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "No inventory records found for product."
                });
            }
            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Inventories fetched successfully.",
                Data = data
            });
        }

        // 🟢 Thêm số lượng sản phẩm vào tồn kho
        [HttpPost("add-quantity")]
        public async Task<IActionResult> AddQuantity([FromBody] StockInForm form)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Status = 400,
                    Message = "Dữ liệu nhập kho không hợp lệ"
                });
            }

            var result = await _inventoryService.StockInAsync(form);
            
            if (result.Status == 1) 
            {
                return Ok(new ApiResponse<InventoryResponseDTO>
                {
                    Status = 200,
                    Message = result.Message,
                    Data = result.Data
                });
            }
            else
            {
                // Xử lý lỗi (VD: ProductId không tồn tại)
                return BadRequest(new ApiResponse<object>
                {
                    Status = 400,
                    Message = result.Message
                });
            }
        }

        // 🟢 Lấy tổng quan tồn kho
        [HttpGet("summary")]
        public async Task<IActionResult> GetInventorySummary()
        {
            var result = await _inventoryService.GetInventorySummaryAsync();
            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Inventory summary fetched successfully.",
                Data = result.Data
            });
        }

        // Các filter theo categoryId/supplierId đã được tích hợp vào GET /inventories

        // 🟢 Lấy danh sách sản phẩm sắp hết hàng
        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStockProducts(
            [FromQuery] int threshold = 10,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _inventoryService.GetLowStockProductsAsync(threshold, page, pageSize);

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get low stock products successfully.",
                Data = new
                {
                    total = result.Total,
                    page = result.Page,
                    pageSize = result.PageSize,
                    totalPages = result.TotalPages,
                    data = result.Data
                }
            });
        }

        // 🟢 Cập nhật số lượng tồn kho theo InventoryId (giá trị tuyệt đối)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] InventoryUpdateForm form)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Status = 400,
                    Message = "Dữ liệu cập nhật không hợp lệ"
                });
            }

            var result = await _inventoryService.UpdateQuantityAsync(id, form);
            if (result.Status == 200)
            {
                return Ok(result);
            }

            if (result.Status == 404)
            {
                return NotFound(result);
            }

            return StatusCode(result.Status, result);
        }
    }
}