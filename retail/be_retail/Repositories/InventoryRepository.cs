using be_retail.Data;
using be_retail.DTOs;
using be_retail.DTOs.Inventory;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace be_retail.Repositories
{
    public class InventoryRepository
{
        private readonly AppDbContext _context;

        public InventoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResponse<InventoryResponseDTO>> GetInventoriesAsync(int page = 1, int pageSize = 10, string? search = null, string? sortBy = null, bool desc = true, int? categoryId = null, int? supplierId = null, string? categoryName = null, string? supplierName = null)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p.Category)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Supplier)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(i => i.Product.Name.Contains(search) || 
                                        i.Product.Barcode!.Contains(search) ||
                                        (i.Product.Category != null && i.Product.Category.Name.Contains(search)) ||
                                        (i.Product.Supplier != null && i.Product.Supplier.Name.Contains(search)));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(i => i.Product.CategoryId == categoryId);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(i => i.Product.SupplierId == supplierId);
            }

            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                query = query.Where(i => i.Product.Category != null && i.Product.Category.Name.Contains(categoryName));
            }

            if (!string.IsNullOrWhiteSpace(supplierName))
            {
                query = query.Where(i => i.Product.Supplier != null && i.Product.Supplier.Name.Contains(supplierName));
            }

            // Sort động
            sortBy = sortBy?.ToLower() ?? "created_at";
            Expression<Func<Inventory, object>> sortExpr = sortBy switch
            {
                "product_name" => i => i.Product.Name,
                "barcode" => i => i.Product.Barcode!,
                "price" => i => i.Product.Price,
                "created_at" => i => i.CreatedAt,
                "category_name" => i => i.Product.Category != null ? i.Product.Category.Name : "",
                "supplier_name" => i => i.Product.Supplier != null ? i.Product.Supplier.Name : "",
                _ => i => i.CreatedAt
            };

            query = desc ? query.OrderByDescending(sortExpr) : query.OrderBy(sortExpr);

            var totalCount = await query.CountAsync();
            var inventories = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ProductName = i.Product.Name,
                    Barcode = i.Product.Barcode,
                    Price = i.Product.Price,
                    Unit = i.Product.Unit,
                    CategoryId = i.Product.CategoryId,
                    CategoryName = i.Product.Category != null ? i.Product.Category.Name : null,
                    SupplierId = i.Product.SupplierId,
                    SupplierName = i.Product.Supplier != null ? i.Product.Supplier.Name : null,
                    IsLowStock = i.Quantity < 10
                })
                .ToListAsync();

            return new PagedResponse<InventoryResponseDTO>(inventories, totalCount, page, pageSize);
        }

        public async Task<Inventory?> GetByProductIdAsync(int productId)
        {
            return await _context.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == productId);
        }

        public async Task<InventoryResponseDTO?> GetDtoByProductIdAsync(int productId)
        {
            return await _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p.Category)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Supplier)
                .Where(i => i.ProductId == productId)
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ProductName = i.Product.Name,
                    Barcode = i.Product.Barcode,
                    Price = i.Product.Price,
                    Unit = i.Product.Unit,
                    CategoryId = i.Product.CategoryId,
                    CategoryName = i.Product.Category != null ? i.Product.Category.Name : null,
                    SupplierId = i.Product.SupplierId,
                    SupplierName = i.Product.Supplier != null ? i.Product.Supplier.Name : null,
                    IsLowStock = i.Quantity < 10
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<InventoryResponseDTO>> GetDtosByProductIdOrderedAsync(int productId, bool desc = true)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p.Category)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Supplier)
                .Where(i => i.ProductId == productId)
                .AsQueryable();

            query = desc ? query.OrderByDescending(i => i.CreatedAt) : query.OrderBy(i => i.CreatedAt);

            return await query
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ProductName = i.Product.Name,
                    Barcode = i.Product.Barcode,
                    Price = i.Product.Price,
                    Unit = i.Product.Unit,
                    CategoryId = i.Product.CategoryId,
                    CategoryName = i.Product.Category != null ? i.Product.Category.Name : null,
                    SupplierId = i.Product.SupplierId,
                    SupplierName = i.Product.Supplier != null ? i.Product.Supplier.Name : null,
                    IsLowStock = i.Quantity < 10
                })
                .ToListAsync();
        }

        public async Task<Inventory?> GetByIdAsync(int inventoryId)
        {
            return await _context.Inventories
                .FirstOrDefaultAsync(i => i.InventoryId == inventoryId);
        }

        public async Task<Inventory> CreateAsync(Inventory inventory)
        {
            _context.Inventories.Add(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        public async Task<Inventory> UpdateAsync(Inventory inventory)
        {
            _context.Inventories.Update(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        public async Task<Inventory?> UpdateQuantityAsync(int inventoryId, int quantity)
        {
            var inventory = await GetByIdAsync(inventoryId);
            if (inventory == null)
            {
                return null;
            }

            inventory.Quantity = quantity;
            inventory.UpdatedAt = DateTime.UtcNow;

            _context.Inventories.Update(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        public async Task<InventoryResponseDTO?> GetInventoryDetailAsync(int inventoryId)
        {
            return await _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p.Category)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Supplier)
                .Where(i => i.InventoryId == inventoryId)
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ProductName = i.Product.Name,
                    Barcode = i.Product.Barcode,
                    Price = i.Product.Price,
                    Unit = i.Product.Unit,
                    CategoryId = i.Product.CategoryId,
                    CategoryName = i.Product.Category != null ? i.Product.Category.Name : null,
                    SupplierId = i.Product.SupplierId,
                    SupplierName = i.Product.Supplier != null ? i.Product.Supplier.Name : null,
                    IsLowStock = i.Quantity < 10
                })
                .FirstOrDefaultAsync();
        }

        public async Task<object> GetSummaryAsync()
        {
            var summary = await _context.Inventories
                .Include(i => i.Product)
                .GroupBy(i => 1)
                .Select(g => new
                {
                    TotalProducts = g.Count(),
                    TotalQuantity = g.Sum(i => i.Quantity),
                    TotalValue = g.Sum(i => i.Quantity * i.Product.Price),
                    LowStockProducts = g.Count(i => i.Quantity < 10)
                })
                .FirstOrDefaultAsync();

            return summary ?? new { TotalProducts = 0, TotalQuantity = 0, TotalValue = (decimal)0, LowStockProducts = 0 };
        }

        public async Task<Inventory> CreateOrUpdateInventoryAsync(int productId, int quantityChange)
        {
            var inventory = await GetByProductIdAsync(productId);
            if (inventory == null)
            {
                inventory = new Inventory
                {
                    ProductId = productId,
                    Quantity = quantityChange,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(inventory);
            }
            else
            {
                inventory.Quantity += quantityChange;
                inventory.UpdatedAt = DateTime.UtcNow;
                _context.Inventories.Update(inventory);
            }

            await _context.SaveChangesAsync();
            return inventory;
        }

        public async Task<PagedResponse<InventoryResponseDTO>> GetLowStockProductsAsync(
            int threshold,
            int page,
            int pageSize)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                    .ThenInclude(p => p.Category)
                .Include(i => i.Product)
                    .ThenInclude(p => p.Supplier)
                .Where(i => i.Quantity <= threshold)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var inventories = await query
                .OrderBy(i => i.Quantity)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    ProductName = i.Product.Name,
                    Barcode = i.Product.Barcode,
                    Price = i.Product.Price,
                    Unit = i.Product.Unit,
                    CategoryId = i.Product.CategoryId,
                    CategoryName = i.Product.Category != null ? i.Product.Category.Name : null,
                    SupplierId = i.Product.SupplierId,
                    SupplierName = i.Product.Supplier != null ? i.Product.Supplier.Name : null,
                    IsLowStock = i.Quantity <= threshold
                })
                .ToListAsync();

            return new PagedResponse<InventoryResponseDTO>(inventories, totalCount, page, pageSize);
        }
    }
}
