using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RetailMobile.Models;
using System.Collections.ObjectModel;

namespace RetailMobile.Presentation;

/// <summary>
/// Test ViewModel with hardcoded data for debugging
/// </summary>
public partial class ProductListTestViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<Product> products = new();

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private string? errorMessage;

    [ObservableProperty]
    private string searchText = string.Empty;

    [ObservableProperty]
    private string? selectedSortOption = "Tên sản phẩm";

    [ObservableProperty]
    private string? selectedCategory = "Tất cả";

    public List<string> SortOptions { get; } = new() { "Tên sản phẩm", "Giá tăng dần", "Giá giảm dần" };
    public List<string> Categories { get; } = new() { "Tất cả", "Đồ uống", "Bánh kẹo", "Gia vị", "Đồ gia dụng", "Mỹ phẩm" };
    public string Title => "Test Products";

    public ProductListTestViewModel()
    {
        LoadProductsCommand = new AsyncRelayCommand(LoadTestDataAsync);
        SearchCommand = new AsyncRelayCommand(LoadTestDataAsync);
        RefreshCommand = new AsyncRelayCommand(LoadTestDataAsync);

        // Auto-load test data
        _ = LoadTestDataAsync();
    }

    public IAsyncRelayCommand LoadProductsCommand { get; }
    public IAsyncRelayCommand SearchCommand { get; }
    public IAsyncRelayCommand RefreshCommand { get; }

    public async Task OnNavigatedToAsync()
    {
        await LoadTestDataAsync();
    }

    private async Task LoadTestDataAsync()
    {
        try
        {
            IsLoading = true;
            ErrorMessage = null;

            Console.WriteLine("[TEST] Loading hardcoded test data...");

            await Task.Delay(500); // Simulate loading

            Products.Clear();

            // Add test products
            var testProducts = new List<Product>
            {
                new Product
                {
                    ProductId = 1,
                    ProductName = "Nike Sneakers",
                    CategoryName = "Footwear",
                    Price = 1500,
                    ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
                    CurrentStock = 50
                },
                new Product
                {
                    ProductId = 2,
                    ProductName = "Pink Embroidered Dress",
                    CategoryName = "EARTHEN Rose Pink",
                    Price = 1900,
                    ImageUrl = "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400",
                    CurrentStock = 25
                },
                new Product
                {
                    ProductId = 3,
                    ProductName = "Black Winter Jacket",
                    CategoryName = "Autumn And Winter",
                    Price = 2499,
                    ImageUrl = "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
                    CurrentStock = 30
                },
                new Product
                {
                    ProductId = 4,
                    ProductName = "Summer Sandals",
                    CategoryName = "Footwear",
                    Price = 899,
                    ImageUrl = "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400",
                    CurrentStock = 60
                },
                new Product
                {
                    ProductId = 5,
                    ProductName = "Denim Jeans",
                    CategoryName = "Casual Wear",
                    Price = 1200,
                    ImageUrl = "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
                    CurrentStock = 40
                },
                new Product
                {
                    ProductId = 6,
                    ProductName = "White T-Shirt",
                    CategoryName = "Basic",
                    Price = 299,
                    ImageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
                    CurrentStock = 100
                }
            };

            foreach (var product in testProducts)
            {
                Products.Add(product);
            }

            Console.WriteLine($"[TEST] Loaded {Products.Count} test products");
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Test load error: {ex.Message}";
            Console.WriteLine($"[TEST] Error: {ex}");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToProductDetailAsync(Product product)
    {
        Console.WriteLine($"[TEST] Product clicked: {product.ProductId} - {product.ProductName}");
        await Task.CompletedTask;
    }
}
