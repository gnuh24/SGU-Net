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
            switch (result.Status)
            {
                case 200:
                    return Ok(result);
                case 404:
                    return NotFound(result);
                case 500:
                    return StatusCode(500, result);
                default:
                    return StatusCode(result.Status, result);
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchOrders([FromQuery] OrderSearchForm form)
        {
            var result = await _service.SearchAsync(form);
            switch (result.Status)
            {
                case 200:
                    return Ok(result);
                case 400:
                    return BadRequest(result);
                case 500:
                    return StatusCode(500, result);
                default:
                    return StatusCode(result.Status, result);
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateForm form)
        {
            var result = await _service.CreateAsync(form);
            switch (result.Status)
            {
                case 200:
                    return Ok(result);
                case 400:
                    return BadRequest(result);
                case 404:
                    return NotFound(result);
                case 500:
                    return StatusCode(500, result);
                default:
                    return StatusCode(result.Status, result);
            }
        }

        [HttpPatch("update/{id}")]
        public async Task<IActionResult> UpdateOrder(int id, [FromBody] OrderUpdateForm form)
        {
            var result = await _service.UpdateAsync(id, form);
            switch (result.Status)
            {
                case 200:
                    return Ok(result);
                case 400:
                    return BadRequest(result);
                case 404:
                    return NotFound(result);
                case 500:
                    return StatusCode(500, result);
                default:
                    return StatusCode(result.Status, result);
            }
        }

        [HttpPatch("cancel/{id}")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var result = await _service.CancelAsync(id);
            switch (result.Status)
            {
                case 200:
                    return Ok(result);
                case 400:
                    return BadRequest(result);
                case 404:
                    return NotFound(result);
                case 500:
                    return StatusCode(500, result);
                default:
                    return StatusCode(result.Status, result);
            }
        }

    }
}