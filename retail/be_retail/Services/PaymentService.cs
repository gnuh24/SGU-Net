using be_retail.Api;
using be_retail.Data;
using be_retail.DTOs;
using be_retail.Models;
using be_retail.Repositories;
using Microsoft.EntityFrameworkCore;

namespace be_retail.Services
{
    public class PaymentService
    {
        private readonly PaymentRepository _repository;
        private readonly OrderService _orderService;
        private readonly OrderRepository _orderRepository;
        private readonly MoMoService _momoService;
        private readonly VNPayService _vnpayService;
        private readonly AppDbContext _context;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            PaymentRepository repository,
            OrderService orderService,
            OrderRepository orderRepository,
            MoMoService momoService,
            VNPayService vnpayService,
            AppDbContext context,
            ILogger<PaymentService> logger)
        {
            _repository = repository;
            _orderService = orderService;
            _orderRepository = orderRepository;
            _momoService = momoService;
            _vnpayService = vnpayService;
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponse<MoMoPaymentResponse>> CreateMoMoPaymentAsync(MoMoPaymentRequest request)
        {
            try
            {
                // Lấy thông tin order
                var order = await _orderRepository.Query()
                    .Include(o => o.Payment)
                    .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

                if (order == null)
                {
                    return new ApiResponse<MoMoPaymentResponse>(404, "Không tìm thấy đơn hàng", null);
                }

                if (order.Status == "paid")
                {
                    return new ApiResponse<MoMoPaymentResponse>(400, "Đơn hàng đã được thanh toán", null);
                }

                var orderInfo = $"Thanh toan don hang #{order.OrderId}";
                var momoOrderId = $"ORDER_{order.OrderId}_{DateTime.Now:yyyyMMddHHmmss}";

                // Tạo payment request với MoMo
                var momoResponse = await _momoService.CreatePaymentAsync(
                    momoOrderId,
                    request.Amount,
                    orderInfo,
                    request.ReturnUrl,
                    request.NotifyUrl
                );

                if (momoResponse.ResultCode == 0 && !string.IsNullOrEmpty(momoResponse.PayUrl))
                {
                    // Cập nhật payment với transaction ID từ MoMo
                    var payment = await _repository.GetByOrderIdAsync(order.OrderId);
                    if (payment != null)
                    {
                        payment.PaymentMethod = "momo";
                        payment.PaymentTranId = long.TryParse(momoResponse.OrderId?.Replace("ORDER_", ""), out var tranId) ? tranId : 0;
                        await _repository.UpdateAsync(payment);
                    }

                    // Cập nhật order status thành pending (chờ thanh toán)
                    order.Status = "pending";
                    await _orderRepository.UpdateAsync(order);
                }

                return new ApiResponse<MoMoPaymentResponse>(
                    momoResponse.ResultCode == 0 ? 200 : 400,
                    momoResponse.Message,
                    momoResponse
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating MoMo payment");
                return new ApiResponse<MoMoPaymentResponse>(500, $"Lỗi hệ thống: {ex.Message}", null);
            }
        }

        public async Task<ApiResponse<bool>> HandleMoMoCallbackAsync(MoMoCallbackRequest callback)
        {
            try
            {
                // Verify signature
                if (!_momoService.VerifySignature(callback))
                {
                    _logger.LogWarning($"Invalid MoMo signature for order {callback.OrderId}");
                    return new ApiResponse<bool>(400, "Invalid signature", false);
                }

                // Extract order ID from MoMo order ID (format: ORDER_{orderId}_{timestamp})
                var orderIdStr = callback.OrderId.Split('_')[1];
                if (!int.TryParse(orderIdStr, out var orderId))
                {
                    _logger.LogWarning($"Invalid order ID format: {callback.OrderId}");
                    return new ApiResponse<bool>(400, "Invalid order ID", false);
                }

                // Sử dụng GetByIdAsync để đảm bảo entity được track đúng cách
                var order = await _orderRepository.GetByIdAsync(orderId);

                if (order == null)
                {
                    _logger.LogWarning($"Order not found: {orderId}");
                    return new ApiResponse<bool>(404, "Order not found", false);
                }

                // Check result code: 0 = success
                if (callback.ResultCode == 0)
                {
                    // Sử dụng transaction để đảm bảo cả order và payment được cập nhật cùng lúc
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Payment successful - cập nhật order status
                        order.Status = "paid";
                        _context.Orders.Update(order);

                        // Update payment
                        var payment = order.Payment;
                        if (payment != null)
                        {
                            payment.PaymentMethod = "momo";
                            payment.PaymentTranId = callback.TransId;
                            payment.PaymentDate = DateTime.Now;
                            _context.Payments.Update(payment);
                        }
                        else
                        {
                            // Nếu chưa có payment, tạo mới
                            payment = new Models.Payment
                            {
                                OrderId = order.OrderId,
                                Amount = order.TotalAmount - order.DiscountAmount,
                                PaymentMethod = "momo",
                                PaymentTranId = callback.TransId,
                                PaymentDate = DateTime.Now
                            };
                            _context.Payments.Add(payment);
                        }

                        // Save tất cả changes và commit transaction
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        _logger.LogInformation($"MoMo payment successful for order {orderId}, transId: {callback.TransId}. Order status updated to 'paid'.");
                        return new ApiResponse<bool>(200, "Payment processed successfully", true);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, $"Error updating order and payment for order {orderId}");
                        throw;
                    }
                }
                else
                {

                    _logger.LogWarning($"MoMo payment failed for order {orderId}: {callback.Message}");
                    
                    // Có thể cập nhật payment để ghi nhận lỗi (optional)
                    var payment = order.Payment;
                    if (payment != null)
                    {
                        // Ghi nhận payment method đã thử
                        payment.PaymentMethod = "momo";
                        // PaymentDate vẫn null vì chưa thanh toán thành công
                        await _repository.UpdateAsync(payment);
                    }
                    
                    return new ApiResponse<bool>(400, $"Payment failed: {callback.Message}", false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling MoMo callback");
                    return new ApiResponse<bool>(500, $"Lỗi hệ thống: {ex.Message}", false);
            }
        }

        /// <summary>
        /// Manual update payment status to paid (dùng khi callback từ MoMo chưa đến)
        /// </summary>
        public async Task<ApiResponse<bool>> ManualUpdatePaymentStatusAsync(int orderId, long? transId = null)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);

                if (order == null)
                {
                    _logger.LogWarning($"Order not found for manual update: {orderId}");
                    return new ApiResponse<bool>(404, "Order not found", false);
                }

                if (order.Status == "paid")
                {
                    _logger.LogInformation($"Order {orderId} is already paid");
                    return new ApiResponse<bool>(200, "Order is already paid", true);
                }

                // Sử dụng transaction để đảm bảo cả order và payment được cập nhật cùng lúc
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Cập nhật order status
                    order.Status = "paid";
                    _context.Orders.Update(order);

                    // Update payment
                    var payment = order.Payment;
                    if (payment != null)
                    {
                        payment.PaymentMethod = "momo";
                        if (transId.HasValue)
                        {
                            payment.PaymentTranId = transId.Value;
                        }
                        payment.PaymentDate = DateTime.Now;
                        _context.Payments.Update(payment);
                    }
                    else
                    {
                        // Nếu chưa có payment, tạo mới
                        payment = new Models.Payment
                        {
                            OrderId = order.OrderId,
                            Amount = order.TotalAmount - order.DiscountAmount,
                            PaymentMethod = "momo",
                            PaymentTranId = transId ?? 0,
                            PaymentDate = DateTime.Now
                        };
                        _context.Payments.Add(payment);
                    }

                    // Save tất cả changes và commit transaction
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"Manual update: Order {orderId} status updated to 'paid'. TransId: {transId}");
                    return new ApiResponse<bool>(200, "Order status updated successfully", true);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Error manually updating order {orderId}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in manual update payment status for order {orderId}");
                return new ApiResponse<bool>(500, $"Lỗi hệ thống: {ex.Message}", false);
            }
        }

        /// <summary>
        /// Tạo payment URL với VNPay
        /// </summary>
        public async Task<ApiResponse<VNPayPaymentResponse>> CreateVNPayPaymentAsync(VNPayPaymentRequest request)
        {
            try
            {
                // Lấy thông tin order
                var order = await _orderRepository.Query()
                    .Include(o => o.Payment)
                    .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

                if (order == null)
                {
                    return new ApiResponse<VNPayPaymentResponse>(404, "Không tìm thấy đơn hàng", null);
                }

                if (order.Status == "paid")
                {
                    return new ApiResponse<VNPayPaymentResponse>(400, "Đơn hàng đã được thanh toán", null);
                }

                var orderInfo = request.OrderInfo ?? $"Thanh toan don hang #{order.OrderId}";
                var vnpayOrderId = order.OrderId.ToString();

                // Tạo payment URL với VNPay
                var paymentUrl = _vnpayService.CreatePaymentUrl(
                    vnpayOrderId,
                    request.Amount,
                    orderInfo,
                    request.ReturnUrl
                );

                if (!string.IsNullOrEmpty(paymentUrl))
                {
                    // Cập nhật payment method
                    var payment = await _repository.GetByOrderIdAsync(order.OrderId);
                    if (payment != null)
                    {
                        payment.PaymentMethod = "vnpay";
                        await _repository.UpdateAsync(payment);
                    }

                    // Cập nhật order status thành pending (chờ thanh toán)
                    order.Status = "pending";
                    await _orderRepository.UpdateAsync(order);
                }

                return new ApiResponse<VNPayPaymentResponse>(
                    200,
                    "Tạo payment URL thành công",
                    new VNPayPaymentResponse
                    {
                        PaymentUrl = paymentUrl,
                        OrderId = vnpayOrderId
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment");
                return new ApiResponse<VNPayPaymentResponse>(500, $"Lỗi hệ thống: {ex.Message}", null);
            }
        }

        /// <summary>
        /// Xử lý callback từ VNPay
        /// </summary>
        public async Task<ApiResponse<bool>> HandleVNPayCallbackAsync(VNPayCallbackRequest callback)
        {
            try
            {
                // Verify signature
                if (!_vnpayService.VerifySignature(callback))
                {
                    _logger.LogWarning($"Invalid VNPay signature for order {callback.vnp_TxnRef}");
                    return new ApiResponse<bool>(400, "Invalid signature", false);
                }

                // Extract order ID
                if (!int.TryParse(callback.vnp_TxnRef, out var orderId))
                {
                    _logger.LogWarning($"Invalid order ID format: {callback.vnp_TxnRef}");
                    return new ApiResponse<bool>(400, "Invalid order ID", false);
                }

                // Lấy order
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    _logger.LogWarning($"Order not found: {orderId}");
                    return new ApiResponse<bool>(404, "Order not found", false);
                }

                // Check response code: 00 = success
                if (callback.vnp_ResponseCode == "00" && callback.vnp_TransactionStatus == "00")
                {
                    // Payment successful
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Cập nhật order status
                        order.Status = "paid";
                        _context.Orders.Update(order);

                        // Update payment
                        var payment = order.Payment;
                        if (payment != null)
                        {
                            payment.PaymentMethod = "vnpay";
                            if (long.TryParse(callback.vnp_TransactionNo, out var transId))
                            {
                                payment.PaymentTranId = transId;
                            }
                            payment.PaymentDate = DateTime.Now;
                            _context.Payments.Update(payment);
                        }
                        else
                        {
                            // Nếu chưa có payment, tạo mới
                            payment = new Models.Payment
                            {
                                OrderId = order.OrderId,
                                Amount = order.TotalAmount - order.DiscountAmount,
                                PaymentMethod = "vnpay",
                                PaymentTranId = long.TryParse(callback.vnp_TransactionNo, out var transId) ? transId : 0,
                                PaymentDate = DateTime.Now
                            };
                            _context.Payments.Add(payment);
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        _logger.LogInformation($"VNPay payment successful for order {orderId}, transId: {callback.vnp_TransactionNo}. Order status updated to 'paid'.");
                        return new ApiResponse<bool>(200, "Payment processed successfully", true);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, $"Error updating order and payment for order {orderId}");
                        throw;
                    }
                }
                else
                {
                    _logger.LogWarning($"VNPay payment failed for order {orderId}: ResponseCode={callback.vnp_ResponseCode}");
                    
                    // Ghi nhận payment method đã thử
                    var payment = order.Payment;
                    if (payment != null)
                    {
                        payment.PaymentMethod = "vnpay";
                        await _repository.UpdateAsync(payment);
                    }
                    
                    return new ApiResponse<bool>(400, $"Payment failed: ResponseCode={callback.vnp_ResponseCode}", false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling VNPay callback");
                return new ApiResponse<bool>(500, $"Lỗi hệ thống: {ex.Message}", false);
            }
        }
    }
}