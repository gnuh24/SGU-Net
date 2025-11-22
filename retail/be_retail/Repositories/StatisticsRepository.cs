using be_retail.Models;
using be_retail.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace be_retail.Repositories
{
    public class StatisticsRepository
    {
        private readonly AppDbContext _context;

        public StatisticsRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetStatisticsAsync(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.Orders
                .Where(o => o.Status == "paid"); // chỉ tính đơn đã thanh toán

            if (startDate.HasValue)
            {
                // Start of day (00:00:00)
                var inclusiveStartDate = startDate.Value.Date;
                query = query.Where(o => o.OrderDate >= inclusiveStartDate);
            }

            if (endDate.HasValue)
            {
                // End of day (23:59:59.9999999)
                var inclusiveEndDate = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(o => o.OrderDate <= inclusiveEndDate);
            }

            // Tổng đơn hàng
            var totalOrders = await query.CountAsync();

            // Tổng doanh thu sau khi trừ discount
            var totalRevenue = await query.SumAsync(o => (decimal?)(o.TotalAmount - o.DiscountAmount)) ?? 0;

            // Số khách hàng duy nhất đã mua hàng (không tính khách vãng lai - customerId = 0 hoặc null)
            var totalCustomers = await query
                .Where(o => o.CustomerId != null && o.CustomerId > 0)
                .Select(o => o.CustomerId)
                .Distinct()
                .CountAsync();

            return new
            {
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TotalCustomers = totalCustomers
            };
        }

public async Task<object> GetProductStatisticsAsync(
    DateTime? startDate,
    DateTime? endDate,
    int? categoryId,
    int? top,            // Nếu có giá trị -> lấy top N
    int page = 1,        // Nếu không có top -> phân trang
    int pageSize = 10)
{
    // Nếu không truyền ngày -> mặc định là tháng hiện tại
    if (!startDate.HasValue || !endDate.HasValue)
    {
        var now = DateTime.Now;
        startDate ??= new DateTime(now.Year, now.Month, 1);
        endDate ??= startDate.Value.AddMonths(1).AddDays(-1);
    }

    var inclusiveEndDate = endDate.Value.Date.AddDays(1).AddTicks(-1);

    // Query cơ bản
    var query = from od in _context.OrderItems
                // SỬA: Dùng tên thuộc tính PascalCase từ C# Model
                join o in _context.Orders on od.OrderId equals o.OrderId
                join p in _context.Products on od.ProductId equals p.ProductId
                join c in _context.Categories on p.CategoryId equals c.CategoryId
                // SỬA: Dùng tên thuộc tính PascalCase
                where o.Status == "paid"
                    && o.OrderDate >= startDate.Value
                    && o.OrderDate <= inclusiveEndDate
                select new
                {
                    // SỬA: Dùng tên thuộc tính PascalCase
                    p.ProductId,
                    // SỬA: product_name được map vào thuộc tính "Name"
                    ProductName = p.Name, 
                    p.CategoryId,
                    // SỬA: Giả định category_name cũng được map vào "Name"
                    CategoryName = c.Name, 
                    od.Quantity,

                    // SỬA: Model OrderItem CÓ "Subtotal", dùng nó sẽ chính xác nhất
                    Revenue = od.Subtotal
                };

    // Lọc theo category (nếu có)
    if (categoryId.HasValue)
    {
        // SỬA: Filter bằng CategoryId
        query = query.Where(x => x.CategoryId == categoryId.Value);
    }

    // Gộp nhóm theo sản phẩm
    var grouped = from x in query
                // SỬA: Group bằng các thuộc tính đã select
                group x by new { x.ProductId, x.ProductName, x.CategoryName } into g
                select new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    CategoryName = g.Key.CategoryName,
                    TotalQuantitySold = g.Sum(x => x.Quantity), // SỬA
                    TotalRevenue = g.Sum(x => x.Revenue)
                };

    // Sắp xếp theo số lượng bán, rồi tới doanh thu
    grouped = grouped
        .OrderByDescending(x => x.TotalQuantitySold)
        .ThenByDescending(x => x.TotalRevenue);

    // Nếu có tham số top -> lấy top N sản phẩm
    if (top.HasValue && top.Value > 0)
    {
        var topProducts = await grouped.Take(top.Value).ToListAsync();
        return new { Data = topProducts };
    }

    // Ngược lại, phân trang
    var totalCount = await grouped.CountAsync();
    var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

    var items = await grouped
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return new
    {
        TotalCount = totalCount,
        TotalPages = totalPages,
        CurrentPage = page,
        PageSize = pageSize,
        Data = items
    };
}

    /// <summary>
    /// Thống kê khách hàng theo doanh thu và số lượng đơn hàng.
    /// </summary>
    public async Task<object> GetCustomerStatisticsAsync(
        DateTime? startDate,
        DateTime? endDate,
        int page = 1,
        int pageSize = 10)
    {
        // 1. Thiết lập khoảng thời gian (mặc định là tháng hiện tại)
        if (!startDate.HasValue || !endDate.HasValue)
        {
            var now = DateTime.Now;
            startDate ??= new DateTime(now.Year, now.Month, 1);
            endDate ??= startDate.Value.AddMonths(1).AddDays(-1);
        }

        // Đảm bảo lấy hết ngày cuối cùng (đến 23:59:59)
        var inclusiveEndDate = endDate.Value.Date.AddDays(1).AddTicks(-1);

        // 2. Query cơ bản: Lấy các đơn hàng "đã thanh toán" trong khoảng thời gian
        var query = from o in _context.Orders
                    // Join với Khách hàng để lấy thông tin
                    join c in _context.Customers on o.CustomerId equals c.CustomerId
                    where o.Status == "paid"
                       && o.OrderDate >= startDate.Value
                       && o.OrderDate <= inclusiveEndDate
                       && c.IsDeleted == false // Lọc các khách hàng chưa bị xóa
                    select new
                    {
                        // Lấy các thông tin cần để nhóm
                        o.CustomerId,
                        c.Name, // Model Customer dùng "Name"
                        c.Phone,
                        c.Email,
                        o.TotalAmount // Lấy tổng tiền của đơn hàng đó
                    };

        // 3. Gộp nhóm theo khách hàng
        var grouped = from x in query
                      group x by new { x.CustomerId, x.Name, x.Phone, x.Email } into g
                      select new
                      {
                          CustomerId = g.Key.CustomerId,
                          Name = g.Key.Name,
                          Phone = g.Key.Phone,
                          Email = g.Key.Email,
                          // Đếm số lượng đơn hàng trong nhóm
                          TotalOrders = g.Count(), 
                          // Tính tổng số tiền họ đã chi tiêu
                          TotalAmountSpent = g.Sum(x => x.TotalAmount) 
                      };

        // 4. Sắp xếp: Ưu tiên khách hàng chi tiêu nhiều nhất
        grouped = grouped
            .OrderByDescending(x => x.TotalAmountSpent)
            .ThenByDescending(x => x.TotalOrders);

        // 5. Phân trang
        var totalCount = await grouped.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await grouped
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // 6. Trả về kết quả
        return new
        {
            TotalCount = totalCount,
            TotalPages = totalPages,
            CurrentPage = page,
            PageSize = pageSize,
            Data = items
        };
    }

    }
}
