using be_retail.Api; 
using be_retail.DTOs.Inventory;
using be_retail.Models;
using be_retail.Repositories;
using be_retail.DTOs;
using System.ComponentModel.DataAnnotations;

namespace be_retail.Services
{
    public class InventoryService 
    {
        private readonly InventoryRepository _inventoryRepository;
        private readonly ProductRepository _productRepository; 

        public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository)
        {
            _inventoryRepository = inventoryRepository;
            _productRepository = productRepository;
        }

        public async Task<PagedResponse<InventoryResponseDTO>> GetInventoriesAsync(
            int page, 
            int pageSize, 
            string? search)
        {
            return await _inventoryRepository.GetInventoriesAsync(page, pageSize, search);
        }

        public async Task<InventoryResponseDTO?> GetInventoryDetailAsync(int id)
        {
            return await _inventoryRepository.GetInventoryDetailAsync(id);
        }

        public async Task<ApiResponse<object>> GetInventorySummaryAsync()
        {
            var summary = await _inventoryRepository.GetSummaryAsync();
            return new ApiResponse<object> { Status = 1, Message = "Lấy tổng quan tồn kho thành công", Data = summary };
        }

        public async Task<ApiResponse<InventoryResponseDTO>> StockInAsync(StockInForm form)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(form.ProductId);
                if (product == null || product.IsDeleted)
                {
                    return new ApiResponse<InventoryResponseDTO>
                    {
                        Status = 0,
                        Message = "Mã sản phẩm không tồn tại hoặc đã bị xóa"
                    };
                }
                
                var updatedInventory = await _inventoryRepository.CreateOrUpdateInventoryAsync(form.ProductId, form.Quantity);

                var responseDto = new InventoryResponseDTO
                {
                    InventoryId = updatedInventory.InventoryId,
                    ProductId = updatedInventory.ProductId,
                    Quantity = updatedInventory.Quantity,
                    UpdatedAt = updatedInventory.UpdatedAt
                };

                return new ApiResponse<InventoryResponseDTO>
                {
                    Status = 1,
                    Message = $"Thêm số lượng thành công: {form.Quantity}",
                    Data = responseDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<InventoryResponseDTO>
                {
                    Status = 0,
                    Message = "Có lỗi xảy ra khi xử lý: " + ex.Message
                };
            }
        }

        public async Task<ApiResponse<InventoryResponseDTO>> UpdateQuantityAsync(int inventoryId, InventoryUpdateForm form)
        {
            try
            {
                if (form == null)
                {
                    return new ApiResponse<InventoryResponseDTO>
                    {
                        Status = 400,
                        Message = "Dữ liệu cập nhật không hợp lệ"
                    };
                }

                var updated = await _inventoryRepository.UpdateQuantityAsync(inventoryId, form.Quantity);
                if (updated == null)
                {
                    return new ApiResponse<InventoryResponseDTO>
                    {
                        Status = 404,
                        Message = "Inventory record not found."
                    };
                }

                var dto = new InventoryResponseDTO
                {
                    InventoryId = updated.InventoryId,
                    ProductId = updated.ProductId,
                    Quantity = updated.Quantity,
                    UpdatedAt = updated.UpdatedAt
                };

                return new ApiResponse<InventoryResponseDTO>
                {
                    Status = 200,
                    Message = "Inventory updated successfully.",
                    Data = dto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<InventoryResponseDTO>
                {
                    Status = 500,
                    Message = "Có lỗi xảy ra khi xử lý: " + ex.Message
                };
            }
        }
    }
}