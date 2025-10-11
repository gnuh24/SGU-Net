using be_retail.Data;
using be_retail.DTOs;
using be_retail.Models;
using Microsoft.EntityFrameworkCore;

namespace be_retail.Repositories
{
    class OrderRepository
    {
        private readonly AppDbContext _context;
        public OrderRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.Payment)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderId == id);
        }

        public async Task<List<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Payment)
                .ToListAsync();
        }

        public async Task<PagedResult<Order>> SearchAsync(string? keyword, int pageNumber, int pageSize)
        {
            var query = _context.Orders.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
                query = query.Where(o => o.Status.Contains(keyword) ||
                                        o.Customer.Name.Contains(keyword));

            int totalCount = await query.CountAsync();

            var data = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Order>
            {
                Data = data,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
        public async Task CreateAsync(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

        }
        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();

        }
        public async Task DeleteAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

            }
        }
    }
}