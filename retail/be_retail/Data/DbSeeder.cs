using Microsoft.EntityFrameworkCore;
using be_retail.Data;
using be_retail.Models;

namespace be_retail.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (!await context.Suppliers.AnyAsync(s => s.Name == "Các nhà cung cấp khác"))
            {
                var defaultSupplier = new Supplier
                {
                    Name = "Các nhà cung cấp khác",
                    IsDeleted = false
                };
                context.Suppliers.Add(defaultSupplier);
            }

            if (!await context.Categories.AnyAsync(c => c.Name == "Chưa phân loại"))
            {
                var defaultCategory = new Category
                {
                    Name = "Chưa phân loại",
                    IsDeleted = false
                };
                context.Categories.Add(defaultCategory);
            }

            await context.SaveChangesAsync();
        }
    }
}
