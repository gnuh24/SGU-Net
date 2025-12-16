using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Services;

public interface ICartService
{
    Task<int> AddItemAsync(CartItem item);
    Task<bool> AddItemWithApiAsync(
        int productId,
        string productName,
        int quantity,
        decimal price,
        string category,
        string imageUrl,
        bool syncToBackend);

    Task<int> UpdateItemAsync(CartItem item);
    Task<List<CartItem>> GetCartAsync();
    Task<int> RemoveItemAsync(CartItem item);
    Task<int> ClearCart();
}
