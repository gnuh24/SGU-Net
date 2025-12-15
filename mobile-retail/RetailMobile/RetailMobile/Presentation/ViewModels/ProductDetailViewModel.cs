using CommunityToolkit.Mvvm.ComponentModel;
using Microsoft.UI.Xaml.Data;
using RetailMobile.Models;
using RetailMobile.Services;
using System.Threading.Tasks;

namespace RetailMobile.Presentation;

[Bindable]
public partial class ProductDetailViewModel : ObservableObject
{
    private readonly CartService _cartService;

    [ObservableProperty]
    private Product? product;

    [ObservableProperty]
    private int quantity = 1;

    [ObservableProperty]
    private decimal totalPrice;

    public string TotalPriceText => $"{TotalPrice:N0}đ";

    public ProductDetailViewModel(CartService cartService)
    {
        _cartService = cartService;
    }

    public void SetProduct(Product product)
    {
        System.Diagnostics.Debug.WriteLine($"[ViewModel] SetProduct called: {product.ProductName}");
        Product = product;
        Quantity = 1;
        UpdateTotalPrice();
    }

    public void IncreaseQuantity()
    {
        System.Diagnostics.Debug.WriteLine($"[ViewModel] IncreaseQuantity: {Quantity} -> {Quantity + 1}");
        Quantity++;
        UpdateTotalPrice();
    }

    public void DecreaseQuantity()
    {
        if (Quantity > 1)
        {
            System.Diagnostics.Debug.WriteLine($"[ViewModel] DecreaseQuantity: {Quantity} -> {Quantity - 1}");
            Quantity--;
            UpdateTotalPrice();
        }
    }

    private void UpdateTotalPrice()
    {
        if (Product != null)
        {
            TotalPrice = Product.Price * Quantity;
            System.Diagnostics.Debug.WriteLine($"[ViewModel] UpdateTotalPrice: {Quantity} x {Product.Price} = {TotalPrice}");
        }
    }

    partial void OnQuantityChanged(int value)
    {
        System.Diagnostics.Debug.WriteLine($"[ViewModel] OnQuantityChanged triggered: {value}");
    }

    partial void OnProductChanged(Product? value)
    {
        System.Diagnostics.Debug.WriteLine($"[ViewModel] OnProductChanged triggered: {value?.ProductName ?? "null"}");
    }

    partial void OnTotalPriceChanged(decimal value)
    {
        OnPropertyChanged(nameof(TotalPriceText));
    }

    public async Task<bool> AddToCartAsync()
    {
        if (Product == null)
        {
            System.Diagnostics.Debug.WriteLine($"[ViewModel] Cannot add to cart: Product is null");
            return false;
        }

        try
        {
            System.Diagnostics.Debug.WriteLine($"[ViewModel] Adding {Quantity}x {Product.ProductName} to cart...");
            
            var success = await _cartService.AddItemWithApiAsync(
                Product.ProductId,
                Product.ProductName,
                Quantity,
                Product.Price,
                syncToBackend: true
            );

            if (success)
            {
                System.Diagnostics.Debug.WriteLine($"[ViewModel] Successfully added to cart");
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"[ViewModel] Failed to add to cart");
            }

            return success;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[ViewModel] Error adding to cart: {ex}");
            return false;
        }
    }
}
