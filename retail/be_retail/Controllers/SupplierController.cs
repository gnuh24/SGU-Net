using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Api;
using be_retail.DTOs;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/suppliers")]
    public class SupplierController : ControllerBase
    {
        private readonly SupplierService _supplierService;

        public SupplierController(SupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int pageSize = 10)
        {
            if (page.HasValue)
            {
                var (suppliers, total) = await _supplierService.GetPagedAsync(search, page.Value, pageSize);

                var data = suppliers.Select(s => new SupplierResponseDTO
                {
                    SupplierId = s.SupplierId,
                    Name = s.Name,
                    Phone = s.Phone,
                    Email = s.Email,
                    Address = s.Address
                }).ToList();

                var response = new PagedResponse<SupplierResponseDTO>(data, total, page.Value, pageSize);

                return Ok(new ApiResponse<PagedResponse<SupplierResponseDTO>>
                {
                    Status = 200,
                    Message = "Get suppliers with pagination successfully.",
                    Data = response
                });
            }
            else
            {
                var suppliers = await _supplierService.GetAllAsync(search);

                var data = suppliers.Select(s => new SupplierResponseDTO
                {
                    SupplierId = s.SupplierId,
                    Name = s.Name,
                    Phone = s.Phone,
                    Email = s.Email,
                    Address = s.Address
                }).ToList();

                return Ok(new ApiResponse<object>
                {
                    Status = 200,
                    Message = "Get all suppliers successfully.",
                    Data = data
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier = await _supplierService.GetByIdAsync(id);
            if (supplier == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Supplier not found.",
                    Data = null
                });
            }

            var dto = new SupplierResponseDTO
            {
                SupplierId = supplier.SupplierId,
                Name = supplier.Name,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address
            };

            return Ok(new ApiResponse<SupplierResponseDTO>
            {
                Status = 200,
                Message = "Supplier fetched successfully.",
                Data = dto
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierCreateForm form)
        {
            var created = await _supplierService.CreateAsync(form);

            var dto = new SupplierResponseDTO
            {
                SupplierId = created.SupplierId,
                Name = created.Name,
                Phone = created.Phone,
                Email = created.Email,
                Address = created.Address
            };

            return Ok(new ApiResponse<SupplierResponseDTO>
            {
                Status = 200,
                Message = "Supplier created successfully.",
                Data = dto
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierUpdateForm form)
        {
            var updated = await _supplierService.UpdateAsync(id, form);
            if (updated == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Supplier not found.",
                    Data = null
                });
            }

            var dto = new SupplierResponseDTO
            {
                SupplierId = updated.SupplierId,
                Name = updated.Name,
                Phone = updated.Phone,
                Email = updated.Email,
                Address = updated.Address
            };

            return Ok(new ApiResponse<SupplierResponseDTO>
            {
                Status = 200,
                Message = "Supplier updated successfully.",
                Data = dto
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _supplierService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Supplier not found.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<string>
            {
                Status = 200,
                Message = "Supplier deleted successfully.",
                Data = null
            });
        }
    }
}
