using be_retail.Api;
using be_retail.DTOs;
using be_retail.DTOs.Inventory;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    
    [ApiController]
    [Route("api/v1/inventories")] // Đổi route cho nhất quán với Product
    public class InventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService; // Sử dụng interface

        public InventoryController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // 🟢 Lấy danh sách tồn kho với phân trang
        [HttpGet]
        public async Task<IActionResult> GetInventories(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _inventoryService.GetInventoriesAsync(page, pageSize, search);

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
            
            if (result.Status == 1) // Logic StockIn của Service trả về Status=1 cho thành công
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
    }
}