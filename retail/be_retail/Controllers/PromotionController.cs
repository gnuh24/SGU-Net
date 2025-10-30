using Microsoft.AspNetCore.Mvc;
using be_retail.Services;
using be_retail.Api;
using be_retail.DTOs;
using be_retail.DTOs.Promotion;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/v1/promotions")]
    public class PromotionController : ControllerBase
    {
        private readonly PromotionService _promotionService;

        public PromotionController(PromotionService promotionService)
        {
            _promotionService = promotionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page.HasValue)
                {
                    var (promotions, total) = await _promotionService.GetPagedAsync(search, page.Value, pageSize);

                    var data = promotions.Select(p => new PromotionResponseDTO
                    {
                        PromoId = p.PromoId,
                        PromoCode = p.PromoCode,
                        Description = p.Description,
                        DiscountType = p.DiscountType,
                        DiscountValue = p.DiscountValue,
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        MinOrderAmount = p.MinOrderAmount,
                        UsageLimit = p.UsageLimit,
                        UsedCount = p.UsedCount,
                        Status = p.Status
                    }).ToList();

                    var response = new PagedResponse<PromotionResponseDTO>(data, total, page.Value, pageSize);

                    return Ok(new ApiResponse<PagedResponse<PromotionResponseDTO>>
                    {
                        Status = 200,
                        Message = "Get promotions with pagination successfully.",
                        Data = response
                    });
                }
                else
                {
                    var promotions = await _promotionService.GetAllAsync(search);

                    var data = promotions.Select(p => new PromotionResponseDTO
                    {
                        PromoId = p.PromoId,
                        PromoCode = p.PromoCode,
                        Description = p.Description,
                        DiscountType = p.DiscountType,
                        DiscountValue = p.DiscountValue,
                        StartDate = p.StartDate,
                        EndDate = p.EndDate,
                        MinOrderAmount = p.MinOrderAmount,
                        UsageLimit = p.UsageLimit,
                        UsedCount = p.UsedCount,
                        Status = p.Status
                    }).ToList();

                    return Ok(new ApiResponse<object>
                    {
                        Status = 200,
                        Message = "Get all promotions successfully.",
                        Data = data
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var promotion = await _promotionService.GetByIdAsync(id);
                if (promotion == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Status = 404,
                        Message = "Promotion not found.",
                        Data = null
                    });
                }

                var dto = new PromotionResponseDTO
                {
                    PromoId = promotion.PromoId,
                    PromoCode = promotion.PromoCode,
                    Description = promotion.Description,
                    DiscountType = promotion.DiscountType,
                    DiscountValue = promotion.DiscountValue,
                    StartDate = promotion.StartDate,
                    EndDate = promotion.EndDate,
                    MinOrderAmount = promotion.MinOrderAmount,
                    UsageLimit = promotion.UsageLimit,
                    UsedCount = promotion.UsedCount,
                    Status = promotion.Status
                };

                return Ok(new ApiResponse<PromotionResponseDTO>
                {
                    Status = 200,
                    Message = "Promotion fetched successfully.",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("code/{promoCode}")]
        public async Task<IActionResult> GetByPromoCode(string promoCode)
        {
            try
            {
                var promotion = await _promotionService.GetByPromoCodeAsync(promoCode);
                if (promotion == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Status = 404,
                        Message = "Promotion not found.",
                        Data = null
                    });
                }

                var dto = new PromotionResponseDTO
                {
                    PromoId = promotion.PromoId,
                    PromoCode = promotion.PromoCode,
                    Description = promotion.Description,
                    DiscountType = promotion.DiscountType,
                    DiscountValue = promotion.DiscountValue,
                    StartDate = promotion.StartDate,
                    EndDate = promotion.EndDate,
                    MinOrderAmount = promotion.MinOrderAmount,
                    UsageLimit = promotion.UsageLimit,
                    UsedCount = promotion.UsedCount,
                    Status = promotion.Status
                };

                return Ok(new ApiResponse<PromotionResponseDTO>
                {
                    Status = 200,
                    Message = "Promotion fetched successfully.",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActivePromotions()
        {
            try
            {
                var promotions = await _promotionService.GetActivePromotionsAsync();

                var data = promotions.Select(p => new PromotionResponseDTO
                {
                    PromoId = p.PromoId,
                    PromoCode = p.PromoCode,
                    Description = p.Description,
                    DiscountType = p.DiscountType,
                    DiscountValue = p.DiscountValue,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    MinOrderAmount = p.MinOrderAmount,
                    UsageLimit = p.UsageLimit,
                    UsedCount = p.UsedCount,
                    Status = p.Status
                }).ToList();

                return Ok(new ApiResponse<object>
                {
                    Status = 200,
                    Message = "Get active promotions successfully.",
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PromotionCreateForm form)
        {
            try
            {
                var created = await _promotionService.CreateAsync(form);

                var dto = new PromotionResponseDTO
                {
                    PromoId = created.PromoId,
                    PromoCode = created.PromoCode,
                    Description = created.Description,
                    DiscountType = created.DiscountType,
                    DiscountValue = created.DiscountValue,
                    StartDate = created.StartDate,
                    EndDate = created.EndDate,
                    MinOrderAmount = created.MinOrderAmount,
                    UsageLimit = created.UsageLimit,
                    UsedCount = created.UsedCount,
                    Status = created.Status
                };

                return Ok(new ApiResponse<PromotionResponseDTO>
                {
                    Status = 200,
                    Message = "Promotion created successfully.",
                    Data = dto
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = "An error occurred while creating the promotion.",
                    Data = null
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PromotionUpdateForm form)
        {
            try
            {
                var updated = await _promotionService.UpdateAsync(id, form);
                if (updated == null)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Status = 404,
                        Message = "Promotion not found.",
                        Data = null
                    });
                }

                var dto = new PromotionResponseDTO
                {
                    PromoId = updated.PromoId,
                    PromoCode = updated.PromoCode,
                    Description = updated.Description,
                    DiscountType = updated.DiscountType,
                    DiscountValue = updated.DiscountValue,
                    StartDate = updated.StartDate,
                    EndDate = updated.EndDate,
                    MinOrderAmount = updated.MinOrderAmount,
                    UsageLimit = updated.UsageLimit,
                    UsedCount = updated.UsedCount,
                    Status = updated.Status
                };

                return Ok(new ApiResponse<PromotionResponseDTO>
                {
                    Status = 200,
                    Message = "Promotion updated successfully.",
                    Data = dto
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = "An error occurred while updating the promotion.",
                    Data = null
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _promotionService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new ApiResponse<string>
                    {
                        Status = 404,
                        Message = "Promotion not found.",
                        Data = null
                    });
                }

                return Ok(new ApiResponse<string>
                {
                    Status = 200,
                    Message = "Promotion deleted successfully.",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = "An error occurred while deleting the promotion.",
                    Data = null
                });
            }
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidatePromotion([FromBody] ValidatePromotionRequest request)
        {
            try
            {
                var isValid = await _promotionService.ValidatePromotionAsync(request.PromoCode, request.OrderAmount);
                
                return Ok(new ApiResponse<object>
                {
                    Status = 200,
                    Message = isValid ? "Promotion is valid." : "Promotion is not valid.",
                    Data = new { IsValid = isValid }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<string>
                {
                    Status = 400,
                    Message = ex.Message,
                    Data = null
                });
            }
        }
    }

    public class ValidatePromotionRequest
    {
        public string PromoCode { get; set; } = null!;
        public decimal OrderAmount { get; set; }
    }
}
