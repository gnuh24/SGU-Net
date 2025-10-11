using be_retail.Models;
using be_retail.Repositories;

namespace be_retail.Services
{
    class OrderItemService
    {
        private readonly OrderItemRepository _repository;
        public OrderItemService(OrderItemRepository repository)
        {
            _repository = repository;
        }
        public async Task<OrderItem?> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }
        public async Task<List<OrderItem>> GetByOrderIdAsync(int orderId)
        {
            return await _repository.GetByOrderIdAsync(orderId);
        }
        public async Task CreateAsync(OrderItem orderItem)
        {
            await _repository.CreateAsync(orderItem);
        }
        public async Task UpdateAsync(OrderItem orderItem)
        {
            await _repository.UpdateAsync(orderItem);
        }
        public async Task DeleteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}