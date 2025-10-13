using be_retail.Data;
using be_retail.DTOs;
using be_retail.DTOs.Inventory;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;

namespace be_retail.Repositories
{
    public class InventoryRepository
{
        private readonly AppDbContext _context;

        public InventoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResponse<InventoryResponseDTO>> GetInventoriesAsync(int page = 1, int pageSize = 10, string? search = null)
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
                                        i.Product.Barcode!.Contains(search));
            }

            var totalCount = await query.CountAsync();
            var inventories = await query
                .OrderByDescending(i => i.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InventoryResponseDTO
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return new PagedResponse<InventoryResponseDTO>(inventories, totalCount, page, pageSize);
        }

        public async Task<Inventory?> GetByProductIdAsync(int productId)
        {
            return await _context.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == productId);
        }

        public async Task<Inventory?> GetByIdAsync(int inventoryId)
        {
            return await _context.Inventories
                .FirstOrDefaultAsync(i => i.InventoryId == inventoryId);
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
                    UpdatedAt = i.UpdatedAt
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
                    UpdatedAt = DateTime.UtcNow
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
    }
}
