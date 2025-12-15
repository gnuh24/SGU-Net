using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Api;
using be_retail.DTOs;
using be_retail.Models;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/customers")]
    public class CustomerController : ControllerBase
    {
        private readonly CustomerService _customerService;

        public CustomerController(CustomerService customerService)
        {
            _customerService = customerService;
        }

        // 🟢 Lấy danh sách có paging, search, sort
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] bool desc = true,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (entities, total) = await _customerService.GetPagedAsync(search, sortBy, desc, page, pageSize);

            var data = entities.Select(c => new CustomerResponseDTO
            {
                CustomerId = c.CustomerId,
                Name = c.Name,
                Phone = c.Phone,
                Email = c.Email,
                Address = c.Address,
                CreatedAt = c.CreatedAt
            }).ToList();

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get customers successfully.",
                Data = new
                {
                    total,
                    page,
                    pageSize,
                    data
                }
            });
        }

        // 🟢 Lấy chi tiết khách hàng
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Customer not found.",
                    Data = null
                });
            }

            var dto = new CustomerResponseDTO
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Phone = customer.Phone,
                Email = customer.Email,
                Address = customer.Address,
                CreatedAt = customer.CreatedAt
            };

            return Ok(new ApiResponse<CustomerResponseDTO>
            {
                Status = 200,
                Message = "Customer fetched successfully.",
                Data = dto
            });
        }

        // 🟢 Thêm khách hàng mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerCreateForm form)
        {
            if (string.IsNullOrEmpty(form.Phone))
            {
                return BadRequest(new ApiResponse<CustomerResponseDTO>
                {
                    Status = 400,
                    Message = "Customer created failed.",
                    Data = null
                });
            }

            var created = await _customerService.CreateAsync(form);

            if (created == null) 
            {
                return BadRequest(new ApiResponse<CustomerResponseDTO>
                {
                    Status = 400,
                    Message = "Customer created failed.",
                    Data = null
                });
            }

            var dto = new CustomerResponseDTO
            {
                CustomerId = created.CustomerId,
                Name = created.Name,
                Phone = created.Phone,
                Email = created.Email,
                Address = created.Address,
                CreatedAt = created.CreatedAt
            };

            return Ok(new ApiResponse<CustomerResponseDTO>
            {
                Status = 200,
                Message = "Customer created successfully.",
                Data = dto
            });
        }

        // 🟢 Cập nhật khách hàng
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateForm form)
        {
            var updated = await _customerService.UpdateAsync(id, form);
            if (updated == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Customer not found.",
                    Data = null
                });
            }

            var dto = new CustomerResponseDTO
            {
                CustomerId = updated.CustomerId,
                Name = updated.Name,
                Phone = updated.Phone,
                Email = updated.Email,
                Address = updated.Address,
                CreatedAt = updated.CreatedAt
            };

            return Ok(new ApiResponse<CustomerResponseDTO>
            {
                Status = 200,
                Message = "Customer updated successfully.",
                Data = dto
            });
        }

        // 🗑️ Xóa mềm khách hàng
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _customerService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Customer not found or already deleted.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<string>
            {
                Status = 200,
                Message = "Customer deleted successfully.",
                Data = null
            });
        }
    }
}
