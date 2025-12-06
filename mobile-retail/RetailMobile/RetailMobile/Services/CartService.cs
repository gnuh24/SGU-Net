using Microsoft.EntityFrameworkCore;
using RetailMobile.Data;
using RetailMobile.Models.DTOs;

namespace RetailMobile.Services;

public class CartService
{
    private readonly AppDbContext _context;
    private readonly ApiClient? _apiClient;

    public CartService(AppDbContext context, ApiClient? apiClient = null)
    {
        _context = context;
        _apiClient = apiClient;
    }

    /// <summary>
    /// Add item to local cart (SQLite)
    /// </summary>
    public async Task AddItemAsync(CartItem item)
    {
        _context.CartItems.Add(item);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Add item to local cart and sync to backend via Order API
    /// If product already exists, update quantity instead of creating duplicate
    /// </summary>
    public async Task<bool> AddItemWithApiAsync(int productId, string productName, int quantity, decimal price, bool syncToBackend = true)
    {
        try
        {
            // Check if product already exists in cart
            var existingItem = await _context.CartItems.FindAsync(productId);

            if (existingItem != null)
            {
                // Update quantity if already exists
                existingItem.Quantity += quantity;
                existingItem.Price = price; // Update price in case it changed
                _context.CartItems.Update(existingItem);
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
                _context.CartItems.Add(cartItem);
                System.Diagnostics.Debug.WriteLine($"[CartService] Added new cart item: {productName} x{quantity}");
            }

            await _context.SaveChangesAsync();

            // Sync to backend by creating an order
            if (syncToBackend && _apiClient != null)
            {
                try
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] Creating order via backend API...");

                    // Create order via backend API
                    var orderForm = new OrderCreateForm
                    {
                        CustomerId = 1, // TODO: Get from current user/session
                        UserId = null, // Optional: staff user creating order
                        PromoId = null, // Optional: promotion code
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

                    var response = await _apiClient.PostAsync<OrderCreateForm, ApiResponse<object>>(
                        "api/v1/orders/create",
                        orderForm
                    );

                    if (response != null && response.Status == 200)
                    {
                        System.Diagnostics.Debug.WriteLine($"[CartService] Order created successfully on backend: {response.Message}");
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine($"[CartService] Backend order creation failed: {response?.Message ?? "Unknown error"}");
                    }
                }
                catch (Exception apiEx)
                {
                    System.Diagnostics.Debug.WriteLine($"[CartService] API call failed: {apiEx.Message}");
                    System.Diagnostics.Debug.WriteLine($"[CartService] Stack trace: {apiEx.StackTrace}");
                    // Continue - item is still in local cart
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

    public async Task UpdateItemAsync(CartItem item)
    {
        _context.CartItems.Update(item);
        await _context.SaveChangesAsync();
    }

    public async Task<List<CartItem>> GetCartAsync()
    {
        return await _context.CartItems.ToListAsync();
    }

    public async Task RemoveItemAsync(CartItem item)
    {
        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();
    }

    public async Task ClearCartAsync()
    {
        var items = await _context.CartItems.ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
    }
}
