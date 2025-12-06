namespace RetailMobile.Data;

using Microsoft.EntityFrameworkCore;
using RetailMobile.Models;
using Windows.System;

public class AppDbContext : DbContext
{
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Product> Products { get; set; }

    public DbSet<TokenRecord> Tokens { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> dbContextOptions) : base(dbContextOptions) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(e => e.ProductId);
        });
        modelBuilder.Entity<TokenRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
        });
        base.OnModelCreating(modelBuilder);
    }
}
