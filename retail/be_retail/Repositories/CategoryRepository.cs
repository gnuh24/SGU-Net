using Microsoft.EntityFrameworkCore;
using be_retail.Data;
using be_retail.Models;

namespace be_retail.Repositories
{
    public class CategoryRepository
    {
        private readonly AppDbContext _context;

        public CategoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Category>> GetAllAsync(string? search = null)
        {
            var query = _context.Categories.Where(c => c.IsDeleted == true);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search));
            }

            return await query.OrderBy(c => c.Name).ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == id && c.IsDeleted == true)
                .FirstOrDefaultAsync();
        }

        public async Task<Category> CreateAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<Category?> UpdateAsync(int id, Category category)
        {
            var existingCategory = await GetByIdAsync(id);
            if (existingCategory == null) return null;

            existingCategory.Name = category.Name;

            await _context.SaveChangesAsync();
            return existingCategory;
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var category = await GetByIdAsync(id);
            if (category == null) return false;

            category.IsDeleted = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == id && c.IsDeleted == true)
                .AnyAsync();
        }
    }
}
