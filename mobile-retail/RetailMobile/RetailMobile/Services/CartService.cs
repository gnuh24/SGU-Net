using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using RetailMobile.Models.DTOs;

namespace RetailMobile.Services;

public class CartService
{
    private readonly AppDbContext _db;
    private readonly ApiClient? _apiClient;

    public CartService(AppDbContext db, ApiClient? apiClient = null)
    {
        _db = db;
        _apiClient = apiClient;
    }

    /// <summary>
    /// Legacy method - Simple add without API integration
    /// </summary>
    public async Task<int> AddItemAsync(CartItem item)
    {
        await _db.CartItems.AddAsync(item);
        return await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Add item to cart with duplicate check and optional backend sync
    /// </summary>
    public async Task<bool> AddItemWithApiAsync(
        int productId, 
        string productName, 
        int quantity, 
        decimal price, 
        bool syncToBackend = true)
    {
        try
        {
            // 1. Check if product already exists in cart (duplicate check)
            var existingItem = await _db.CartItems.FindAsync(productId);

            if (existingItem != null)
            {
                // Update quantity if already exists
                existingItem.Quantity += quantity;
                existingItem.Price = price; // Update price in case it changed
                _db.CartItems.Update(existingItem);
                System.Diagnostics.Debug.WriteLine($"[CartService] Updated cart item: {productName} (total qty: {existingItem.Quantity})");
            }
            else
            {
                // Add new item to cart
                var cartItem = new CartItem
                {
                    ProductId = productId,
                    Name = productName,
                    Quantity = quantity,
                    Price = price
                };
                _db.CartItems.Add(cartItem);
                System.Diagnostics.Debug.WriteLine($"[CartService] Added new cart item: {productName} x{quantity}");
            }

            // 2. Save to SQLite local
            await _db.SaveChangesAsync();

            // 3. Sync to backend by creating an order
            if (syncToBackend && _apiClient != null)
            {
                try
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] ========== ADD TO CART ==========");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Product: {productName} (ID: {productId})");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Quantity: {quantity}");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Price: {price:N0}đ");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Total: {(price * quantity):N0}đ");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Creating order via backend API...");
                    
                    // Create order via backend API
                    var orderForm = new OrderCreateForm
                    {
                        CustomerId = 1, // TODO: Get from current user/session
                        UserId = null,
                        PromoId = null,
                        Status = "pending",
                        PaymentMethod = "cash",
                        OrderItems = new List<OrderItemCreateForm>
                        {
                            new OrderItemCreateForm
                            {
                                ProductId = productId,
                                Quantity = quantity
                            }
                        }
                    };

                    var response = await _apiClient.PostAsync<OrderCreateForm, RetailMobile.Models.DTOs.ApiResponse<object>>(
                        "api/v1/orders/create", 
                        orderForm
                    );

                    if (response != null && response.Status == 200)
                    {
                        System.Diagnostics.Debug.WriteLine($"[CartService] ✅ SUCCESS: Order created on backend");
                        System.Diagnostics.Debug.WriteLine($"[CartService] Response: {response.Message}");
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine($"[CartService] ❌ FAILED: {response?.Message ?? "Unknown error"}");
                    }
                    System.Diagnostics.Debug.WriteLine($"[CartService] ===============================");
                }
                catch (Exception apiEx)
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] ❌ API EXCEPTION: {apiEx.Message}");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Stack trace: {apiEx.StackTrace}");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Note: Item still saved in local SQLite");
                    System.Diagnostics.Debug.WriteLine($"[CartService] ===============================");
                    // Continue - item is still in local cart
                }
            }
            else
            {
                if (!syncToBackend)
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] Backend sync disabled (syncToBackend = false)");
                }
                if (_apiClient == null)
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] ApiClient not available");
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[CartService] Error: {ex.Message}");
            return false;
        }
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
