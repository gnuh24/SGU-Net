using be_retail.Api;
using be_retail.DTOs;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/payments")]
    class PaymentsController : ControllerBase
    {
        private readonly PaymentService _service;
        public PaymentsController(Services.PaymentService service)
        {
            _service = service;
        }

        [HttpPost("pay-order")]
        public async Task<IActionResult> CreateOrderAndPay([FromBody] OrderCreateForm orderCreateForm)
        {
            if (orderCreateForm == null)
            {
                return BadRequest(new { Status = 400, Message = "Dữ liệu không hợp lệ", Data = false });
            }
            try
            {
                var result = await _service.CreateOrderAndPay(orderCreateForm);
                if (result.Status == 200)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception)
            {
                return BadRequest(new { Status = 500, Message = "Lỗi xử lý", Data = false });
            }
        }

        [HttpPost("pay-order/{orderId}")]
        public async Task<IActionResult> PayOrder(int orderId)
        {
            try
            {
                var result = await _service.PayOrderAsync(orderId);
                if (result.Status == 200)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception)
            {
                return BadRequest(new { Status = 500, Message = "Lỗi xử lý", Data = false });
            }
        }

        
    }
}