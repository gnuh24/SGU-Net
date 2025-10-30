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

        public async Task<(IEnumerable<Category> items, int total)> GetPagedAsync(string? search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Categories.Where(c => c.IsDeleted == false);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<IEnumerable<Category>> GetAllAsync(string? search = null)
        {
            var query = _context.Categories.Where(c => c.IsDeleted == false);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search));
            }

            return await query.OrderBy(c => c.Name).ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == id && c.IsDeleted == false)
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

            var productsToUpdate = await _context.Products
                .Where(p => p.CategoryId == id)
                .ToListAsync();

            foreach (var product in productsToUpdate)
            {
                product.CategoryId = 1;
            }

            category.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == id && c.IsDeleted == false)
                .AnyAsync();
        }
    }
}
