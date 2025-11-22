using be_retail.Data;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace be_retail.Repositories
{
    public class CustomerRepository
    {
        private readonly AppDbContext _context;

        public CustomerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Customer>> GetPagedAsync(
            string? search,
            string? sortBy,
            bool desc,
            int page,
            int pageSize)
        {
            IQueryable<Customer> query = _context.Customers
                            .Where(c => !c.IsDeleted) // 🔹 Chỉ lấy khách hàng chưa bị xóa
                            .AsQueryable();

            // Search theo tên, phone, email
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    (c.Phone != null && c.Phone.Contains(search)) ||
                    (c.Email != null && c.Email.Contains(search)));
            }

            // Sort động
            sortBy = sortBy?.ToLower() ?? "created_at";
            Expression<Func<Customer, object>> sortExpr = sortBy switch
            {
                "name" => c => c.Name,
                "phone" => c => c.Phone!,
                "email" => c => c.Email!,
                "created_at" => c => c.CreatedAt,
                _ => c => c.CreatedAt
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
            IQueryable<Customer> query = _context.Customers.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c =>
                    c.Name.Contains(search) ||
                    (c.Phone != null && c.Phone.Contains(search)) ||
                    (c.Email != null && c.Email.Contains(search)));
            }

            return await query.CountAsync();
        }

        public async Task<Customer?> GetByIdAsync(int id)
        {
            return await _context.Customers.FindAsync(id);
        }

        public async Task<Customer> CreateAsync(Customer customer)
        {
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task<Customer?> UpdateAsync(int id, Customer updated)
        {
            var existing = await _context.Customers.FindAsync(id);
            if (existing == null) return null;

            existing.Name = updated.Name;
            existing.Phone = updated.Phone;
            existing.Email = updated.Email;
            existing.Address = updated.Address;

            await _context.SaveChangesAsync();
            return existing;
        }


        // 🟢 Xóa mềm
        public async Task<bool> SoftDeleteAsync(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null || customer.IsDeleted)
                return false;

            customer.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        // 🔹 Tìm customer theo số điện thoại
        public async Task<Customer?> GetByPhoneAsync(string phone)
        {
            if (string.IsNullOrEmpty(phone)) return null;

            return await _context.Customers
                .Where(c => !c.IsDeleted && c.Phone == phone)
                .FirstOrDefaultAsync();
        }

 


    }
}
