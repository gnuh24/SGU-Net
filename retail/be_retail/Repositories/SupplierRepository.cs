using Microsoft.EntityFrameworkCore;
using be_retail.Data;
using be_retail.Models;

namespace be_retail.Repositories
{
    public class SupplierRepository
    {
        private readonly AppDbContext _context;

        public SupplierRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Supplier>> GetAllAsync(string? search = null)
        {
            var query = _context.Suppliers.Where(s => s.IsDeleted == true);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s => 
                    s.Name.Contains(search) ||
                    (s.Phone != null && s.Phone.Contains(search)) ||
                    (s.Email != null && s.Email.Contains(search)) ||
                    (s.Address != null && s.Address.Contains(search))
                );
            }

            return await query.OrderBy(s => s.Name).ToListAsync();
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _context.Suppliers
                .Where(s => s.SupplierId == id && s.IsDeleted == true)
                .FirstOrDefaultAsync();
        }

        public async Task<Supplier> CreateAsync(Supplier supplier)
        {
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return supplier;
        }

        public async Task<Supplier?> UpdateAsync(int id, Supplier supplier)
        {
            var existingSupplier = await GetByIdAsync(id);
            if (existingSupplier == null) return null;

            existingSupplier.Name = supplier.Name;
            existingSupplier.Phone = supplier.Phone;
            existingSupplier.Email = supplier.Email;
            existingSupplier.Address = supplier.Address;

            await _context.SaveChangesAsync();
            return existingSupplier;
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var supplier = await GetByIdAsync(id);
            if (supplier == null) return false;

            supplier.IsDeleted = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Suppliers
                .Where(s => s.SupplierId == id && s.IsDeleted == true)
                .AnyAsync();
        }
    }
}
