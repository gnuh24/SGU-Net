using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using SQLite;

namespace RetailMobile.Services;
public class CartService
{
    private readonly AppDbContext _db;

    public CartService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<int> AddItemAsync(CartItem item)
    {
        await _db.CartItems.AddAsync(item);
        return await _db.SaveChangesAsync();
    }

    public async Task<int> UpdateItemAsync(CartItem item)
    {
        _db.CartItems.Update(item);
        return await _db.SaveChangesAsync();
    }

    public async Task<List<CartItem>> GetCartAsync()
    {
        return await _db.CartItems.ToListAsync();
    }

    public async Task<int> RemoveItemAsync(CartItem item)
    {
        _db.CartItems.Remove(item);
        return await _db.SaveChangesAsync();
    }

    public async Task<int> ClearCart()
    {
        _db.CartItems.RemoveRange(_db.CartItems);
        return await _db.SaveChangesAsync();
    }
}
