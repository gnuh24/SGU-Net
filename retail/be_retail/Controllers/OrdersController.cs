using be_retail.DTOs;
using be_retail.Services;
using Microsoft.AspNetCore.Mvc;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/orders")]
    class OrdersController : ControllerBase
    {
        private readonly OrderService _service;
        public OrdersController(OrderService service)
        {
            _service = service;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            return StatusCode(result.Status, result);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateForm form)
        {
            var result = await _service.CreateAsync(form);
            return StatusCode(result.Status, result);
        }

        [HttpPatch("update/{id}")]
        public async Task<IActionResult> UpdateOrder(int id, [FromBody] OrderUpdateForm form)
        {
            var result = await _service.UpdateAsync(id, form);
            return StatusCode(result.Status, result);
        }

        [HttpPut("cancel/{id}")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var result = await _service.CancelAsync(id);
            return StatusCode(result.Status, result);
        }

    }
}