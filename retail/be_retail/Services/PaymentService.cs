using be_retail.Api;
using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;

namespace be_retail.Services
{
    public class PaymentService
    {
        private readonly PaymentRepository _repository;
        private readonly OrderService _orderService;
        private readonly OrderRepository _orderRepository;
        public PaymentService(PaymentRepository repository,
                                OrderService orderService,
                                OrderRepository orderRepository)
        {
            _repository = repository;
            _orderService = orderService;
            _orderRepository = orderRepository;
        }
    }
}