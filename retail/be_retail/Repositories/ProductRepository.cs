using be_retail.Data;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace be_retail.Repositories
{
    public class ProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetPagedAsync(
            string? search,
            string? sortBy,
            bool desc,
            int page,
            int pageSize)
        {
            IQueryable<Product> query = _context.Products.AsQueryable();

            // Search theo tên, barcode, price
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.ProductName.Contains(search) ||
                    (p.Barcode != null && p.Barcode.Contains(search)) ||
                    p.Price.ToString().Contains(search));
            }

            // Sort động
            sortBy = sortBy?.ToLower() ?? "created_at";
            Expression<Func<Product, object>> sortExpr = sortBy switch
            {
                "product_name" => p => p.ProductName,
                "barcode" => p => p.Barcode!,
                "price" => p => p.Price,
                "created_at" => p => p.CreatedAt,
                "is_deleted" => p => p.IsDeleted,
                _ => p => p.CreatedAt
            };

            query = desc ? query.OrderByDescending(sortExpr) : query.OrderBy(sortExpr);

            // Paging
            return await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> CountAsync(string? search)
        {
            IQueryable<Product> query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.ProductName.Contains(search) ||
                    (p.Barcode != null && p.Barcode.Contains(search)) ||
                    p.Price.ToString().Contains(search));
            }

            return await query.CountAsync();
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products.FindAsync(id);
        }

        public async Task<Product> CreateAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product?> UpdateAsync(int id, Product updated)
        {
            var existing = await _context.Products.FindAsync(id);
            if (existing == null) return null;

            existing.ProductName = updated.ProductName;
            existing.Barcode = updated.Barcode;
            existing.Price = updated.Price;
            existing.Unit = updated.Unit;
            existing.IsDeleted = updated.IsDeleted;
            existing.CategoryId = updated.CategoryId;
            existing.SupplierId = updated.SupplierId;
            
            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<Product?> DeleteAsync(int id)
        {
            var existing = await _context.Products.FindAsync(id);
            if (existing == null) return null;

            existing.IsDeleted = "1";
            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
