namespace RetailMobile.Data;

using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<CartItem> CartItems { get; set; }
    public AppDbContext(DbContextOptions<AppDbContext> dbContextOptions) : base(dbContextOptions) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartItem>(entiry =>
        {
            entiry.HasKey(e => e.ProductId);
            entiry.Property(e => e.Name).IsRequired();
        });
    }
}
