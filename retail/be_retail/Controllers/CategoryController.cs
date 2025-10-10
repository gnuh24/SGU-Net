using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Api;
using be_retail.DTOs;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/categories")]
    public class CategoryController : ControllerBase
    {
        private readonly CategoryService _categoryService;

        public CategoryController(CategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search)
        {
            var categories = await _categoryService.GetAllAsync(search);

            var data = categories.Select(c => new CategoryResponseDTO
            {
                CategoryId = c.CategoryId,
                Name = c.Name
            }).ToList();

            return Ok(new ApiResponse<object>
            {
                Status = 200,
                Message = "Get categories successfully.",
                Data = data
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryService.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Category not found.",
                    Data = null
                });
            }

            var dto = new CategoryResponseDTO
            {
                CategoryId = category.CategoryId,
                Name = category.Name
            };

            return Ok(new ApiResponse<CategoryResponseDTO>
            {
                Status = 200,
                Message = "Category fetched successfully.",
                Data = dto
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryCreateForm form)
        {
            var created = await _categoryService.CreateAsync(form);

            var dto = new CategoryResponseDTO
            {
                CategoryId = created.CategoryId,
                Name = created.Name
            };

            return Ok(new ApiResponse<CategoryResponseDTO>
            {
                Status = 200,
                Message = "Category created successfully.",
                Data = dto
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateForm form)
        {
            var updated = await _categoryService.UpdateAsync(id, form);
            if (updated == null)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Category not found.",
                    Data = null
                });
            }

            var dto = new CategoryResponseDTO
            {
                CategoryId = updated.CategoryId,
                Name = updated.Name
            };

            return Ok(new ApiResponse<CategoryResponseDTO>
            {
                Status = 200,
                Message = "Category updated successfully.",
                Data = dto
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _categoryService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new ApiResponse<string>
                {
                    Status = 404,
                    Message = "Category not found.",
                    Data = null
                });
            }

            return Ok(new ApiResponse<string>
            {
                Status = 200,
                Message = "Category deleted successfully.",
                Data = null
            });
        }
    }
}
