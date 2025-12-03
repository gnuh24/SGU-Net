using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using SQLite;

namespace RetailMobile.Services;
public class CartService
{
    private readonly SQLiteAsyncConnection _db;

    public CartService(DatabaseService database)
    {
        _db = database.Db;
    }

    public async Task<int> AddItemAsync(CartItem item)
    => await _db.InsertAsync(item);

    public async Task<int> UpdateItemAsync(CartItem item)
    => await _db.UpdateAsync(item);

    public async Task<List<CartItem>> GetCartAsync()
    => await _db.Table<CartItem>().ToListAsync();

    public async Task<int> RemoveItemAsync(CartItem item)
    => await _db.DeleteAsync(item);

    public Task ClearCart()
    => _db.DeleteAllAsync<CartItem>();

}

