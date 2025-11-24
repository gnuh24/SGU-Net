using be_retail.Api;
using be_retail.DTOs;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly PaymentService _service;
        private readonly OrderService _orderService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            PaymentService service,
            OrderService orderService,
            ILogger<PaymentsController> logger)
        {
            _service = service;
            _orderService = orderService;
            _logger = logger;
        }

        /// <summary>
        /// Tạo payment request với MoMo
        /// </summary>
        [HttpPost("momo/create")]
        public async Task<ActionResult<ApiResponse<MoMoPaymentResponse>>> CreateMoMoPayment([FromBody] MoMoPaymentRequest request)
        {
            var result = await _service.CreateMoMoPaymentAsync(request);
            return StatusCode(result.Status, result);
        }

        /// <summary>
        /// Callback từ MoMo sau khi thanh toán
        /// </summary>
        [HttpPost("momo/callback")]
        public async Task<ActionResult<ApiResponse<bool>>> MoMoCallback([FromBody] MoMoCallbackRequest callback)
        {
            _logger.LogInformation($"MoMo callback received: OrderId={callback.OrderId}, ResultCode={callback.ResultCode}");
            
            var result = await _service.HandleMoMoCallbackAsync(callback);
            
            // MoMo expects HTTP 200 with specific format
            if (result.Status == 200)
            {
                return Ok(new { resultCode = 0, message = "Success" });
            }
            else
            {
                return Ok(new { resultCode = result.Status, message = result.Message });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái thanh toán MoMo
        /// </summary>
        [HttpGet("momo/status/{orderId}")]
        public async Task<ActionResult<ApiResponse<object>>> GetMoMoPaymentStatus(int orderId)
        {
            try
            {
                // Lấy thông tin order từ database
                var orderResult = await _orderService.GetByIdAsync(orderId);
                
                if (orderResult.Status == 200 && orderResult.Data != null)
                {
                    return Ok(new ApiResponse<object>(200, "Success", new 
                    { 
                        orderId, 
                        status = orderResult.Data.Status,
                        paymentMethod = orderResult.Data.Payment?.PaymentMethod,
                        paymentDate = orderResult.Data.Payment?.PaymentDate,
                        paymentTranId = orderResult.Data.Payment?.PaymentTranId
                    }));
                }
                
                return NotFound(new ApiResponse<object>(404, "Order not found", null));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting MoMo payment status for order {orderId}");
                return StatusCode(500, new ApiResponse<object>(500, "Internal server error", null));
            }
        }

        /// <summary>
        /// Manual update order status to paid (dùng khi callback từ MoMo chưa đến hoặc bị lỗi)
        /// </summary>
        [HttpPost("momo/manual-update/{orderId}")]
        public async Task<ActionResult<ApiResponse<bool>>> ManualUpdatePaymentStatus(int orderId, [FromBody] ManualUpdateRequest? request = null)
        {
            try
            {
                _logger.LogInformation($"Manual update payment status requested for order {orderId}");
                
                var result = await _service.ManualUpdatePaymentStatusAsync(orderId, request?.TransId);
                
                if (result.Status == 200)
                {
                    return Ok(result);
                }
                
                return StatusCode(result.Status, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error manually updating payment status for order {orderId}");
                return StatusCode(500, new ApiResponse<bool>(500, "Internal server error", false));
            }
        }

        /// <summary>
        /// Tạo payment request với VNPay
        /// </summary>
        [HttpPost("vnpay/create")]
        public async Task<ActionResult<ApiResponse<VNPayPaymentResponse>>> CreateVNPayPayment([FromBody] VNPayPaymentRequest request)
        {
            var result = await _service.CreateVNPayPaymentAsync(request);
            return StatusCode(result.Status, result);
        }

        /// <summary>
        /// Callback từ VNPay sau khi thanh toán (IPN)
        /// </summary>
        [HttpPost("vnpay/callback")]
        public async Task<ActionResult<ApiResponse<bool>>> VNPayCallback([FromForm] VNPayCallbackRequest callback)
        {
            _logger.LogInformation($"VNPay callback received: OrderId={callback.vnp_TxnRef}, ResponseCode={callback.vnp_ResponseCode}");
            
            var result = await _service.HandleVNPayCallbackAsync(callback);
            
            // VNPay expects HTTP 200 with specific format
            if (result.Status == 200)
            {
                return Ok(new { RspCode = "00", Message = "Success" });
            }
            else
            {
                return Ok(new { RspCode = "99", Message = result.Message });
            }
        }

        /// <summary>
        /// Return URL từ VNPay (sau khi user thanh toán)
        /// </summary>
        [HttpGet("vnpay/return")]
        public async Task<ActionResult> VNPayReturn([FromQuery] VNPayCallbackRequest callback)
        {
            _logger.LogInformation($"VNPay return received: OrderId={callback.vnp_TxnRef}, ResponseCode={callback.vnp_ResponseCode}");
            
            var result = await _service.HandleVNPayCallbackAsync(callback);
            
            // Redirect về frontend với kết quả
            var returnUrl = $"{Request.Scheme}://{Request.Host}/payment/vnpay/return?orderId={callback.vnp_TxnRef}&responseCode={callback.vnp_ResponseCode}";
            
            if (result.Status == 200)
            {
                return Redirect($"{returnUrl}&status=success");
            }
            else
            {
                return Redirect($"{returnUrl}&status=failed&message={Uri.EscapeDataString(result.Message)}");
            }
        }
    }

    public class ManualUpdateRequest
    {
        public long? TransId { get; set; }
    }
}