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
    }
}