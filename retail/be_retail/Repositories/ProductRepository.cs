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
            int pageSize,
            int? categoryId,
            int? supplierId,
            string? categoryName,
            string? supplierName,
            bool? isDeleted)
        {
            IQueryable<Product> query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .AsQueryable();

            // Search theo tên, barcode, price, category, supplier
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    (p.Barcode != null && p.Barcode.Contains(search)) ||
                    p.Price.ToString().Contains(search) ||
                    (p.Category != null && p.Category.Name.Contains(search)) ||
                    (p.Supplier != null && p.Supplier.Name.Contains(search)));
            }

            // Filter theo Category/Supplier Id
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }
            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId);
            }

            // Filter theo tên Category/Supplier (contains, case-insensitive via DB collation)
            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                query = query.Where(p => p.Category != null && p.Category.Name.Contains(categoryName));
            }
            if (!string.IsNullOrWhiteSpace(supplierName))
            {
                query = query.Where(p => p.Supplier != null && p.Supplier.Name.Contains(supplierName));
            }
            if (isDeleted.HasValue)
            {
                query = query.Where(p => p.IsDeleted == isDeleted.Value);
            }
            else
            {
                query = query.Where(p => p.IsDeleted == false);
            }

            // Sort động
            sortBy = sortBy?.ToLower() ?? "created_at";
            Expression<Func<Product, object>> sortExpr = sortBy switch
            {
                "product_name" => p => p.Name,
                "barcode" => p => p.Barcode!,
                "price" => p => p.Price,
                "created_at" => p => p.CreatedAt,
                "is_deleted" => p => p.IsDeleted,
                "category_name" => p => p.Category != null ? p.Category.Name : "",
                "supplier_name" => p => p.Supplier != null ? p.Supplier.Name : "",
                _ => p => p.CreatedAt
            };

            query = desc ? query.OrderByDescending(sortExpr) : query.OrderBy(sortExpr);

            // Paging
            return await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> CountAsync(
            string? search,
            int? categoryId,
            int? supplierId,
            string? categoryName,
            string? supplierName,
            bool? isDeleted)
        {
            IQueryable<Product> query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    (p.Barcode != null && p.Barcode.Contains(search)) ||
                    p.Price.ToString().Contains(search) ||
                    (p.Category != null && p.Category.Name.Contains(search)) ||
                    (p.Supplier != null && p.Supplier.Name.Contains(search)));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }
            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId);
            }

            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                query = query.Where(p => p.Category != null && p.Category.Name.Contains(categoryName));
            }
            if (!string.IsNullOrWhiteSpace(supplierName))
            {
                query = query.Where(p => p.Supplier != null && p.Supplier.Name.Contains(supplierName));
            }

            if (isDeleted.HasValue)
            {
                query = query.Where(p => p.IsDeleted == isDeleted.Value);
            }
            else
            {
                query = query.Where(p => p.IsDeleted == false);
            }

            return await query.CountAsync();
        }

        public async Task<List<Product>> FindByBarcodeAsync(string barcode)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Where(p => p.Barcode == barcode)
                .ToListAsync();
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.ProductId == id);
        }

        public async Task<Product> CreateAsync(Product product)
        {
            if (product.CategoryId != null)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == product.CategoryId);
                if (!categoryExists)
                    throw new Exception("Loại sản phẩm không tồn tại.");
            }

            // Kiểm tra SupplierId
            if (product.SupplierId != null)
            {
                var supplierExists = await _context.Suppliers.AnyAsync(s => s.SupplierId == product.SupplierId);
                if (!supplierExists)
                    throw new Exception("Nhà cung cấp không tồn tại.");
            }
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product?> UpdateAsync(int id, Product updated)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null) return null;

            if (updated.CategoryId != null)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == updated.CategoryId);
                if (!categoryExists)
                    throw new Exception("Loại sản phẩm không tồn tại.");
            }

            // Kiểm tra SupplierId
            if (updated.SupplierId != null)
            {
                var supplierExists = await _context.Suppliers.AnyAsync(s => s.SupplierId == updated.SupplierId);
                if (!supplierExists)
                    throw new Exception("Nhà cung cấp không tồn tại.");
            }
    
            existing.Name = updated.Name;
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
            var existing = await GetByIdAsync(id);
            if (existing == null) return null;

            existing.IsDeleted = true;
            await _context.SaveChangesAsync();
            return existing;
        }

        // Các API by-category/by-supplier đã được tích hợp vào GetPagedAsync/CountAsync
    }
}
