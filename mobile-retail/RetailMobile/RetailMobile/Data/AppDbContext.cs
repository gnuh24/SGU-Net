namespace RetailMobile.Data;

using Microsoft.EntityFrameworkCore;
using RetailMobile.Models;

public class AppDbContext : DbContext
{
    public DbSet<CartItem> CartItems { get; set; }

    public DbSet<TokenRecord> Tokens { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> dbContextOptions) : base(dbContextOptions) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.Property(e => e.Name).IsRequired();
        });
        modelBuilder.Entity<TokenRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
        });
        base.OnModelCreating(modelBuilder);
    }
}
