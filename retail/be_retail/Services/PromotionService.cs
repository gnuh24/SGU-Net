using be_retail.Models;
using be_retail.Repositories;
using be_retail.DTOs.Promotion;

namespace be_retail.Services
{
    public class PromotionService
    {
        private readonly PromotionRepository _promotionRepository;

        public PromotionService(PromotionRepository promotionRepository)
        {
            _promotionRepository = promotionRepository;
        }

        public async Task<(IEnumerable<Promotion> items, int total)> GetPagedAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            return await _promotionRepository.GetPagedAsync(search, page, pageSize);
        }

        public async Task<IEnumerable<Promotion>> GetAllAsync(string? search = null)
        {
            return await _promotionRepository.GetAllAsync(search);
        }

        public async Task<Promotion?> GetByIdAsync(int id)
        {
            return await _promotionRepository.GetByIdAsync(id);
        }

        public async Task<Promotion?> GetByPromoCodeAsync(string promoCode)
        {
            return await _promotionRepository.GetByPromoCodeAsync(promoCode);
        }

        public async Task<Promotion> CreateAsync(PromotionCreateForm form)
        {
            // Validate promo code uniqueness
            if (await _promotionRepository.ExistsByPromoCodeAsync(form.PromoCode))
            {
                throw new InvalidOperationException("Promo code already exists.");
            }

            // Validate date range
            if (form.StartDate >= form.EndDate)
            {
                throw new InvalidOperationException("Start date must be before end date.");
            }

            // Validate discount type
            if (form.DiscountType != "percent" && form.DiscountType != "fixed")
            {
                throw new InvalidOperationException("Discount type must be 'percent' or 'fixed'.");
            }

            // Validate discount value for percent type
            if (form.DiscountType == "percent" && form.DiscountValue > 100)
            {
                throw new InvalidOperationException("Discount percentage cannot exceed 100%.");
            }

            var promotion = new Promotion
            {
                PromoCode = form.PromoCode,
                Description = form.Description,
                DiscountType = form.DiscountType,
                DiscountValue = form.DiscountValue,
                StartDate = form.StartDate,
                EndDate = form.EndDate,
                MinOrderAmount = form.MinOrderAmount,
                UsageLimit = form.UsageLimit,
                Status = form.Status
            };

            return await _promotionRepository.CreateAsync(promotion);
        }

        public async Task<Promotion?> UpdateAsync(int id, PromotionUpdateForm form)
        {
            var existingPromotion = await _promotionRepository.GetByIdAsync(id);
            if (existingPromotion == null) return null;

            // Validate promo code uniqueness (if changed)
            if (existingPromotion.PromoCode != form.PromoCode && 
                await _promotionRepository.ExistsByPromoCodeAsync(form.PromoCode))
            {
                throw new InvalidOperationException("Promo code already exists.");
            }

            // Validate date range
            if (form.StartDate >= form.EndDate)
            {
                throw new InvalidOperationException("Start date must be before end date.");
            }

            // Validate discount type
            if (form.DiscountType != "percent" && form.DiscountType != "fixed")
            {
                throw new InvalidOperationException("Discount type must be 'percent' or 'fixed'.");
            }

            // Validate discount value for percent type
            if (form.DiscountType == "percent" && form.DiscountValue > 100)
            {
                throw new InvalidOperationException("Discount percentage cannot exceed 100%.");
            }

            var promotion = new Promotion
            {
                PromoCode = form.PromoCode,
                Description = form.Description,
                DiscountType = form.DiscountType,
                DiscountValue = form.DiscountValue,
                StartDate = form.StartDate,
                EndDate = form.EndDate,
                MinOrderAmount = form.MinOrderAmount,
                UsageLimit = form.UsageLimit,
                Status = form.Status
            };

            return await _promotionRepository.UpdateAsync(id, promotion);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _promotionRepository.DeleteAsync(id);
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _promotionRepository.ExistsAsync(id);
        }

        public async Task<IEnumerable<Promotion>> GetActivePromotionsAsync()
        {
            return await _promotionRepository.GetActivePromotionsAsync();
        }

        public async Task<bool> IncrementUsageCountAsync(int id)
        {
            return await _promotionRepository.IncrementUsageCountAsync(id);
        }

        public async Task<bool> ValidatePromotionAsync(string promoCode, decimal orderAmount)
        {
            var promotion = await _promotionRepository.GetByPromoCodeAsync(promoCode);
            if (promotion == null) return false;

            var now = DateTime.Now;
            
            // Check if promotion is active
            if (promotion.Status != "active") return false;
            
            // Check date range
            if (promotion.StartDate > now || promotion.EndDate < now) return false;
            
            // Check usage limit
            if (promotion.UsageLimit > 0 && promotion.UsedCount >= promotion.UsageLimit) return false;
            
            // Check minimum order amount
            if (promotion.MinOrderAmount > 0 && orderAmount < promotion.MinOrderAmount) return false;

            return true;
        }
    }
}

