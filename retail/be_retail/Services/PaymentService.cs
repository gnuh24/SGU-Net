using be_retail.Api;
using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;

namespace be_retail.Services
{
    public class PaymentService
    {
        private readonly PaymentRepository _repository;
        private readonly VnPayService _vnPay;
        private readonly OrderService _orderService;
        private readonly OrderRepository _orderRepository;
        public PaymentService(PaymentRepository repository,
                                VnPayService vnPayService,
                                OrderService orderService,
                                OrderRepository orderRepository)
        {
            _repository = repository;
            _vnPay = vnPayService;
            _orderService = orderService;
            _orderRepository = orderRepository;
        }

        public async Task<ApiResponse<string>> PayOrderAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                return new ApiResponse<string>(404, "Không tìm thấy đơn hàng", null);
            }
            OrderResponseDTO orderDto = ToDTO(order);
            string paymentUrl = _vnPay.CreatePaymentUrl(orderDto);
            return new ApiResponse<string>(200, "Đã tạo đường dẫn thanh toán", paymentUrl);
        }

        public async Task<ApiResponse<string>> CreateOrderAndPay(OrderCreateForm orderCreateForm)
        {
            var order = await _orderService.CreateAsync(orderCreateForm);
            if (order.Data == null || order.Status != 200)
            {
                return new ApiResponse<string>(order.Status, order.Message, null);
            }
            string paymentUrl = _vnPay.CreatePaymentUrl(order.Data);
            return new ApiResponse<string>(200, "Đã tạo đường dẫn thanh toán", paymentUrl);
        }

        public OrderResponseDTO ToDTO(Order order)
        {
            return new OrderResponseDTO
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                UserId = order.UserId,
                PromoId = order.PromoId,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                DiscountAmount = order.DiscountAmount,
                OrderDate = order.OrderDate,
                OrderItems = order.OrderItems.Select(oi => new OrderItemResponseDTO
                {
                    OrderItemId = oi.OrderItemId,
                    ProductId = oi.ProductId,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Subtotal = oi.Subtotal
                }).ToList(),
                Payment = new PaymentResponseDTO
                {
                    PaymentId = order.Payment.PaymentId,
                    OrderId = order.Payment.OrderId,
                    Amount = order.Payment.Amount,
                    PaymentMethod = order.Payment.PaymentMethod,
                    PaymentDate = order.Payment.PaymentDate
                }
            };
        }
    }
}