using Microsoft.EntityFrameworkCore;
using be_retail.Data;
using be_retail.Models;

namespace be_retail.Repositories
{
    public class PromotionRepository
    {
        private readonly AppDbContext _context;

        public PromotionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Promotion> items, int total)> GetPagedAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Promotions.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.PromoCode.Contains(search) || 
                                        (p.Description != null && p.Description.Contains(search)));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(p => p.StartDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<IEnumerable<Promotion>> GetAllAsync(string? search = null)
        {
            var query = _context.Promotions.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.PromoCode.Contains(search) || 
                                        (p.Description != null && p.Description.Contains(search)));
            }

            return await query.OrderByDescending(p => p.StartDate).ToListAsync();
        }

        public async Task<Promotion?> GetByIdAsync(int id)
        {
            return await _context.Promotions
                .Where(p => p.PromoId == id)
                .FirstOrDefaultAsync();
        }

        public async Task<Promotion?> GetByPromoCodeAsync(string promoCode)
        {
            return await _context.Promotions
                .Where(p => p.PromoCode == promoCode)
                .FirstOrDefaultAsync();
        }

        public async Task<Promotion> CreateAsync(Promotion promotion)
        {
            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();
            return promotion;
        }

        public async Task<Promotion?> UpdateAsync(int id, Promotion promotion)
        {
            var existingPromotion = await GetByIdAsync(id);
            if (existingPromotion == null) return null;

            existingPromotion.PromoCode = promotion.PromoCode;
            existingPromotion.Description = promotion.Description;
            existingPromotion.DiscountType = promotion.DiscountType;
            existingPromotion.DiscountValue = promotion.DiscountValue;
            existingPromotion.StartDate = promotion.StartDate;
            existingPromotion.EndDate = promotion.EndDate;
            existingPromotion.MinOrderAmount = promotion.MinOrderAmount;
            existingPromotion.UsageLimit = promotion.UsageLimit;
            existingPromotion.Status = promotion.Status;

            await _context.SaveChangesAsync();
            return existingPromotion;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var promotion = await GetByIdAsync(id);
            if (promotion == null) return false;

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Promotions
                .Where(p => p.PromoId == id)
                .AnyAsync();
        }

        public async Task<bool> ExistsByPromoCodeAsync(string promoCode)
        {
            return await _context.Promotions
                .Where(p => p.PromoCode == promoCode)
                .AnyAsync();
        }

        public async Task<IEnumerable<Promotion>> GetActivePromotionsAsync()
        {
            var now = DateTime.Now;
            return await _context.Promotions
                .Where(p => p.Status == "active" && 
                           p.StartDate <= now && 
                           p.EndDate >= now &&
                           (p.UsageLimit == 0 || p.UsedCount < p.UsageLimit))
                .OrderByDescending(p => p.StartDate)
                .ToListAsync();
        }

        public async Task<bool> IncrementUsageCountAsync(int id)
        {
            var promotion = await GetByIdAsync(id);
            if (promotion == null) return false;

            promotion.UsedCount++;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
