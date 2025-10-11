using be_retail.Api;
using be_retail.Data;
using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;

namespace be_retail.Services
{
    class OrderService
    {
        private readonly AppDbContext _context;
        private readonly ProductRepository _productRepo;
        private readonly InventoryRepository _inventoryRepo;
        private readonly PromotionRepository _promoRepo;
        private readonly OrderRepository _orderRepo;
        private readonly OrderItemRepository _orderItemRepo;
        private readonly PaymentRepository _paymentRepo;

        public OrderService(AppDbContext appDbContext,
                            ProductRepository productRepository,
                            InventoryRepository inventoryRepository,
                            PromotionRepository promotionRepository,
                            OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            PaymentRepository paymentRepository)
        {
            _context = appDbContext;
            _productRepo = productRepository;
            _inventoryRepo = inventoryRepository;
            _promoRepo = promotionRepository;
            _orderRepo = orderRepository;
            _orderItemRepo = orderItemRepository;
            _paymentRepo = paymentRepository;
        }

        internal async Task<ApiResponse<OrderResponseDTO>> GetByIdAsync(int id)
        {
            try
            {
                var order = await _orderRepo.GetByIdAsync(id);
                if (order == null)
                    return new ApiResponse<OrderResponseDTO>(404, "Không tìm thấy đơn hàng", new OrderResponseDTO());

                var orderDto = new OrderResponseDTO
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

                return new ApiResponse<OrderResponseDTO>(200, "Lấy đơn hàng thành công", orderDto); 
            }
            catch (Exception ex)
            {
                return new ApiResponse<OrderResponseDTO>(500, "Lỗi khi lấy đơn hàng", new OrderResponseDTO());
            }
        }

        public async Task<ApiResponse<bool>> CreateAsync(OrderCreateForm form)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {

                decimal totalAmount = 0;
                decimal discountAmount = 0;
                var orderItems = new List<OrderItem>();
                foreach (var item in form.OrderItems)
                {
                    var product = await _productRepo.GetByIdAsync(item.ProductId);
                    if (product == null)
                        return new ApiResponse<bool>(404, $"Không tìm thấy sản phẩm ID {item.ProductId}", false);

                    var inventory = await _inventoryRepo.GetByProductIdAsync(item.ProductId);
                    if (inventory == null || inventory.Quantity < item.Quantity)
                        return new ApiResponse<bool>(400, $"Sản phẩm {item.ProductId} không đủ tồn kho", false);

                    var subTotal = product.Price * item.Quantity;
                    totalAmount += subTotal;
                    orderItems.Add
                    (
                        new OrderItem
                        {
                            ProductId = item.ProductId,
                            Quantity = item.Quantity,
                            Price = product.Price,
                            Subtotal = subTotal
                        }
                    );
                    inventory.Quantity -= item.Quantity;
                    await _inventoryRepo.UpdateAsync(inventory);
                }

                if (form.PromoId != null)
                {
                    var promo = await _promoRepo.GetByIdAsync(form.PromoId.Value);
                    if (promo != null && promo.Status == "active"
                        && promo.StartDate <= DateTime.Now
                        && promo.EndDate >= DateTime.Now
                        && totalAmount >= promo.MinOrderValue
                        && promo.UserCount < promo.UsageLimit)
                    {
                        discountAmount = promo.DiscountType == "percent" ?
                                         totalAmount * (promo.DiscountValue / 100) :
                                         promo.DiscountValue;
                        promo.UserCount += 1;
                        await _promoRepo.UpdateAsync(promo);
                    }
                }

                var order = new Order
                {
                    CustomerId = form.CustomerId,
                    UserId = form.UserId,
                    PromoId = form.PromoId,
                    Status = form.Status,
                    TotalAmount = totalAmount,
                    DiscountAmount = discountAmount
                };

                await _orderRepo.CreateAsync(order);

                foreach (var oi in orderItems)
                {
                    oi.OrderId = order.OrderId;
                }
                await _orderItemRepo.AddRangeAsync(orderItems);

                var payment = new Payment
                {
                    OrderId = order.OrderId,
                    Amount = totalAmount - discountAmount,
                    PaymentMethod = form.PaymentMethod,
                    PaymentDate = DateTime.Now
                };

                await _paymentRepo.CreateAsync(payment);

                await transaction.CommitAsync();

                return new ApiResponse<bool>(200, "Tạo đơn hàng thành công", true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ApiResponse<bool>(500, "Lỗi khi tạo đơn hàng", false);
            }
        }
    }
}