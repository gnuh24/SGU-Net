using be_retail.Api;
using be_retail.Data;
using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;
using Microsoft.EntityFrameworkCore;

namespace be_retail.Services
{
    public class OrderService
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

        public async Task<ApiResponse<OrderResponseDTO>> GetByIdAsync(int id)
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

        public async Task<ApiResponse<PagedResponse<OrderBasicDTO>>> SearchAsync(OrderSearchForm form)
        {
            try
            {
                var query = _orderRepo.Query();

                if (form.OrderId.HasValue)
                    query = query.Where(o => o.OrderId == form.OrderId);

                if (form.CustomerId.HasValue)
                    query = query.Where(o => o.CustomerId == form.CustomerId);

                if (form.UserId.HasValue)
                    query = query.Where(o => o.UserId == form.UserId);

                if (!string.IsNullOrEmpty(form.Status))
                    query = query.Where(o => o.Status == form.Status);

                if (form.PromoId.HasValue)
                    query = query.Where(o => o.PromoId == form.PromoId);

                if (form.FromDate.HasValue)
                    query = query.Where(o => o.OrderDate >= form.FromDate.Value);

                if (form.ToDate.HasValue)
                    query = query.Where(o => o.OrderDate <= form.ToDate.Value);

                var total = await query.CountAsync();

                int pageSize = form.PageSize > 0 ? form.PageSize : 10;
                int page = form.Page > 0 ? form.Page : 1;

                query = (form.SortBy?.ToLower(), form.SortDirection?.ToLower()) switch
                {
                    ("total_amount", "asc") => query.OrderBy(o => o.TotalAmount),
                    ("total_amount", "desc") => query.OrderByDescending(o => o.TotalAmount),
                    ("order_date", "asc") => query.OrderBy(o => o.OrderDate),
                    _ => query.OrderByDescending(o => o.OrderDate),
                };

                var data = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var mappedData = data.Select(order => new OrderBasicDTO
                {
                    OrderId = order.OrderId,
                    CustomerId = order.CustomerId,
                    UserId = order.UserId,
                    PromoId = order.PromoId,
                    TotalAmount = order.TotalAmount,
                    DiscountAmount = order.DiscountAmount,
                    Status = order.Status,
                    OrderDate = order.OrderDate,
                }).ToList();


                var result = new PagedResponse<OrderBasicDTO>(mappedData, total, page, pageSize);

                return new ApiResponse<PagedResponse<OrderBasicDTO>>(200, "Lấy danh sách đơn hàng thành công", result);
            }
            catch (Exception ex)
            {
                return new ApiResponse<PagedResponse<OrderBasicDTO>>(500, "Lỗi khi tìm kiếm đơn hàng", new PagedResponse<OrderBasicDTO>(new List<OrderBasicDTO>(), 0, form.Page, form.PageSize));
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
                    var promo = await _promoRepo.GetByIdAsync(form.PromoId ?? -1);
                    if (promo != null && promo.Status == "active"
                        && promo.StartDate <= DateTime.Now
                        && promo.EndDate >= DateTime.Now
                        && totalAmount >= promo.MinOrderAmount
                        && promo.UsedCount < promo.UsageLimit)
                    {
                        discountAmount = promo.DiscountType == "percent" ?
                                         totalAmount * (promo.DiscountValue / 100) :
                                         promo.DiscountValue;
                        promo.UsedCount += 1;
                        await _promoRepo.UpdateAsync(promo.PromoId, promo);
                    }
                    else
                    {
                        return new ApiResponse<bool>(400, "Mã khuyến mãi không hợp lệ hoặc không thể áp dụng", false);
                    }
                }

                if (form.PaymentMethod == "cash")
                {
                    form.Status = "paid";
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

                Payment payment = new Payment
                {
                    OrderId = order.OrderId,
                    Amount = totalAmount - discountAmount,
                    PaymentMethod = form.PaymentMethod,
                };
                if (form.Status == "pending")
                {
                    payment.PaymentDate = DateTime.MinValue;
                }
                else if (form.Status == "paid")
                {
                    payment.PaymentDate = DateTime.Now;
                }

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

        public async Task<ApiResponse<bool>> UpdateAsync(int id, OrderUpdateForm form)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _orderRepo.GetByIdAsync(id);
                if (order == null)
                    return new ApiResponse<bool>(404, "Không tìm thấy đơn hàng", false);

                if (order.Status == "canceled")
                    return new ApiResponse<bool>(400, "Đơn hàng đã bị hủy, không thể chỉnh sửa", false);

                if (order.Status == "paid")
                    return new ApiResponse<bool>(400, "Đơn hàng đã thanh toán, không thể chỉnh sửa", false);

                // Cập nhật thông tin cơ bản
                order.UserId = form.UserId ?? order.UserId;
                order.Status = form.Status ?? order.Status;

                decimal totalAmount = 0;

                // --- Cập nhật chi tiết đơn hàng nếu có ---
                if (form.OrderItems != null && form.OrderItems.Any())
                {
                    var existingItems = await _orderItemRepo.GetByOrderIdAsync(order.OrderId);
                    var existingItemIds = existingItems.Select(i => i.OrderItemId).ToList();

                    foreach (var itemForm in form.OrderItems)
                    {
                        var product = await _productRepo.GetByIdAsync(itemForm.ProductId);
                        if (product == null)
                            return new ApiResponse<bool>(400, $"Sản phẩm ID {itemForm.ProductId} không tồn tại", false);

                        var inventory = await _inventoryRepo.GetByProductIdAsync(itemForm.ProductId);
                        if (inventory == null || inventory.Quantity < itemForm.Quantity)
                            return new ApiResponse<bool>(400, $"Sản phẩm {product.Name} không đủ hàng trong kho", false);

                        if (itemForm.OrderItemId != null)
                        {
                            // --- Cập nhật item cũ ---
                            var existingItem = existingItems.FirstOrDefault(i => i.OrderItemId == itemForm.OrderItemId);
                            if (existingItem != null)
                            {
                                int quantityDiff = itemForm.Quantity - existingItem.Quantity;

                                // Cập nhật tồn kho
                                inventory.Quantity -= quantityDiff;
                                await _inventoryRepo.UpdateAsync(inventory);

                                existingItem.Quantity = itemForm.Quantity;
                                existingItem.Price = product.Price;
                                existingItem.Subtotal = product.Price * itemForm.Quantity;

                                await _orderItemRepo.UpdateAsync(existingItem);
                                totalAmount += existingItem.Subtotal;
                            }
                        }
                        else
                        {
                            // --- Thêm item mới ---
                            var newItem = new OrderItem
                            {
                                OrderId = order.OrderId,
                                ProductId = itemForm.ProductId,
                                Quantity = itemForm.Quantity,
                                Price = product.Price,
                                Subtotal = product.Price * itemForm.Quantity
                            };

                            inventory.Quantity -= itemForm.Quantity;
                            await _inventoryRepo.UpdateAsync(inventory);

                            await _orderItemRepo.CreateAsync(newItem);
                            totalAmount += newItem.Subtotal;
                        }
                    }

                    // --- Xóa item không còn trong form ---
                    var removedItems = existingItems.Where(i => !form.OrderItems.Any(f => f.OrderItemId == i.OrderItemId)).ToList();
                    foreach (var removed in removedItems)
                    {
                        var inventory = await _inventoryRepo.GetByProductIdAsync(removed.ProductId);
                        if (inventory != null)
                        {
                            inventory.Quantity += removed.Quantity; // hoàn lại tồn kho
                            await _inventoryRepo.UpdateAsync(inventory);
                        }
                        await _orderItemRepo.DeleteAsync(removed.OrderItemId);
                        totalAmount -= removed.Subtotal;
                    }
                }
                else
                {
                    // Không truyền items → giữ nguyên tổng tiền cũ
                    totalAmount = order.TotalAmount;
                }

                order.TotalAmount = totalAmount;

                // Nếu có thay đổi mã khuyến mãi
                if (form.PromoId != null && order.PromoId != form.PromoId)
                {
                    var promo = await _promoRepo.GetByIdAsync(form.PromoId ?? -1);
                    // Tính lại giảm giá
                    if (promo != null && promo.Status == "active"
                        && promo.StartDate <= DateTime.Now
                        && promo.EndDate >= DateTime.Now
                        && order.TotalAmount >= promo.MinOrderAmount
                        && promo.UsedCount < promo.UsageLimit
                        )
                    {
                        var oldPromo = await _promoRepo.GetByIdAsync(order.PromoId ?? -1);
                        if (oldPromo != null && oldPromo.UsedCount > 0)
                        {
                            oldPromo.UsedCount -= 1;
                            await _promoRepo.UpdateAsync(oldPromo.PromoId, oldPromo);
                        }
                        order.PromoId = promo.PromoId;
                        order.DiscountAmount = promo.DiscountType == "percent"
                            ? order.TotalAmount * promo.DiscountValue / 100
                            : promo.DiscountValue;

                        // Cập nhật lượt sử dụng
                        promo.UsedCount += 1;
                        await _promoRepo.UpdateAsync(promo.PromoId, promo);
                    }
                    else
                    {
                        return new ApiResponse<bool>(400, "Mã khuyến mãi không hợp lệ hoặc không thể áp dụng", false);
                    }
                }

                // Lưu đơn hàng
                await _orderRepo.UpdateAsync(order);
                Payment payment = new Payment
                {
                    OrderId = order.OrderId,
                    Amount = order.TotalAmount - order.DiscountAmount,
                    PaymentMethod = form.PaymentMethod ?? "cash",
                };
                if (order.Status == "pending")
                {
                    payment.PaymentDate = DateTime.MinValue;
                }
                else if (order.Status == "paid")
                {
                    payment.PaymentDate = DateTime.Now;

                }
                await _paymentRepo.UpsertAsync(payment);

                await transaction.CommitAsync();

                return new ApiResponse<bool>(200, "Cập nhật đơn hàng thành công", true);
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>(500, $"Lỗi hệ thống", false);
            }
        }

        public async Task<ApiResponse<bool>> CancelAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = await _orderRepo.GetByIdAsync(id);
                if (order == null)
                    return new ApiResponse<bool>(404, "Không tìm thấy đơn hàng", false);

                if (order.Status == "canceled")
                    return new ApiResponse<bool>(400, "Đơn hàng đã bị hủy, không thể hủy lại", false);

                if (order.Status == "paid")
                    return new ApiResponse<bool>(400, "Đơn hàng đã thanh toán, không thể hủy", false);

                // Cập nhật trạng thái đơn hàng
                order.Status = "canceled";
                await _orderRepo.UpdateAsync(order);

                // Hoàn trả tồn kho
                var orderItems = await _orderItemRepo.GetByOrderIdAsync(order.OrderId);
                foreach (var item in orderItems)
                {
                    var inventory = await _inventoryRepo.GetByProductIdAsync(item.ProductId);
                    if (inventory != null)
                    {
                        inventory.Quantity += item.Quantity;
                        await _inventoryRepo.UpdateAsync(inventory);
                    }
                }

                // Cập nhật khuyến mãi (nếu có)
                if (order.PromoId != null)
                {
                    var promo = await _promoRepo.GetByIdAsync(order.PromoId ?? -1);
                    if (promo != null && promo.UsedCount > 0)
                    {
                        promo.UsedCount -= 1;
                        await _promoRepo.UpdateAsync(promo.PromoId, promo);
                    }
                }

                await transaction.CommitAsync();

                return new ApiResponse<bool>(200, "Hủy đơn hàng thành công", true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ApiResponse<bool>(500, "Lỗi khi hủy đơn hàng", false);
            }
        }

    }
}