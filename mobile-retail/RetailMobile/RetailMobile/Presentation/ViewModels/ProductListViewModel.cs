using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RetailMobile.Models;
using RetailMobile.Services;
using System.Collections.ObjectModel;
using Uno.Extensions.Navigation;
using Microsoft.Extensions.Options;
using RetailMobile.Helpers;
using RetailMobile.Data;
using Microsoft.EntityFrameworkCore;

namespace RetailMobile.Presentation;

public partial class ProductListViewModel : ObservableObject
{
    private readonly ApiClient _apiClient;
    private readonly INavigator _navigator;
    private readonly ApiClientConfig _config;
    private readonly AppDbContext _dbContext;

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
    private string? selectedCategory;

    public List<string> SortOptions { get; } = new() { "Tên sản phẩm", "Giá tăng dần", "Giá giảm dần" };

    public List<string> Categories { get; } = new() { "Tất cả", "Đồ uống", "Đồ gia dụng", "Thực phẩm" };

    public string Title => "Danh sách Sản phẩm";

    public ProductListViewModel(ApiClient apiClient, INavigator navigator, IOptions<ApiClientConfig> config, AppDbContext dbContext)
    {
        _apiClient = apiClient;
        _navigator = navigator;
        _config = config.Value;
        _dbContext = dbContext;
        LoadProductsCommand = new AsyncRelayCommand(LoadProductsAsync);
        SearchCommand = new AsyncRelayCommand(LoadProductsAsync);
        RefreshCommand = new AsyncRelayCommand(RefreshAndResetAsync);
        SelectedCategory = "Tất cả";
    }

    public IAsyncRelayCommand LoadProductsCommand { get; }
    public IAsyncRelayCommand SearchCommand { get; }
    public IAsyncRelayCommand RefreshCommand { get; }

    // Auto-load when navigating to this page
    public async Task OnNavigatedToAsync()
    {
        await LoadProductsAsync();
    }

    // Refresh and reset all filters
    private async Task RefreshAndResetAsync()
    {
        SearchText = string.Empty;
        SelectedCategory = "Tất cả";
        SelectedSortOption = "Tên sản phẩm";
        await LoadProductsAsync();
    }

    public async Task LoadProductsAsync()
    {
        try
        {
            Console.WriteLine("[ProductListViewModel] LoadProductsAsync - START");
            System.Diagnostics.Debug.WriteLine("[ProductListViewModel] LoadProductsAsync - START");
            
            IsLoading = true;
            ErrorMessage = null;

            Console.WriteLine($"[ProductListViewModel] IsLoading set to: {IsLoading}");

            // Gọi API public để lấy danh sách sản phẩm (không cần authentication)
            var queryParams = new Dictionary<string, string>
            {
                { "page", "1" },
                { "pageSize", "100" },
                { "isDeleted", "false" }
            };

            if (!string.IsNullOrWhiteSpace(SearchText))
            {
                queryParams["search"] = SearchText;
            }

            // Apply category filter
            if (!string.IsNullOrWhiteSpace(SelectedCategory) && SelectedCategory != "Tất cả")
            {
                queryParams["categoryName"] = SelectedCategory;
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(SelectedSortOption))
            {
                switch (SelectedSortOption)
                {
                    case "Giá tăng dần":
                        queryParams["sortBy"] = "price";
                        queryParams["desc"] = "false";
                        break;
                    case "Giá giảm dần":
                        queryParams["sortBy"] = "price";
                        queryParams["desc"] = "true";
                        break;
                    default: // Tên sản phẩm
                        queryParams["sortBy"] = "product_name";
                        queryParams["desc"] = "false";
                        break;
                }
            }

            Console.WriteLine("[ProductListViewModel] Calling API /api/v1/products/public...");
            
            var response = await _apiClient.GetAsync<ProductApiResponse>(
                "/api/v1/products/public",
                queryParams
            );
            Console.WriteLine($"[ProductListViewModel] API Request sent to /api/v1/products/public");

            Console.WriteLine($"[ProductListViewModel] Response received. Data: {response?.Data?.Data?.Count ?? 0} items");

            if (response?.Data?.Data != null)
            {
                Console.WriteLine($"[ProductListViewModel] Clearing old products. Current count: {Products.Count}");
                Products.Clear();
                Console.WriteLine($"[ProductListViewModel] After clear: {Products.Count}");
                
                var baseUrl = ApiClientHelper.GetBaseUrl(_config);
                foreach (var product in response.Data.Data)
                {
                    // Fix Image URL (prepend base URL if relative)
                    if (!string.IsNullOrEmpty(product.ImageUrl) && !product.ImageUrl.StartsWith("http"))
                    {
                        product.ImageUrl = $"{baseUrl.TrimEnd('/')}/{product.ImageUrl.TrimStart('/')}";
                    }
                    Products.Add(product);
                }

                Console.WriteLine($"[ProductListViewModel] After adding products: {Products.Count}");

                // Sync to SQLite (Fire and Forget or Await)
                try
                {
                    // Clear existing cache
                    _dbContext.Products.RemoveRange(_dbContext.Products);
                    await _dbContext.SaveChangesAsync();

                    // Add new data
                    await _dbContext.Products.AddRangeAsync(Products);
                    await _dbContext.SaveChangesAsync();
                    Console.WriteLine($"[DEBUG] Synced {Products.Count} products to SQLite.");
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"[DEBUG] Failed to sync to SQLite: {dbEx.Message}");
                }
            }
            else
            {
                ErrorMessage = "Không có dữ liệu sản phẩm";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Lỗi kết nối: {ex.Message}. Đang tải dữ liệu offline...";
            System.Diagnostics.Debug.WriteLine($"Error loading products: {ex}");
            Console.WriteLine($"[DEBUG] Error loading products: {ex}");

            // Fallback to SQLite
            try
            {
                var localProducts = await _dbContext.Products.ToListAsync();
                if (localProducts.Any())
                {
                    Products.Clear();
                    foreach (var p in localProducts)
                    {
                        Products.Add(p);
                    }
                    ErrorMessage = "Đang hiển thị dữ liệu offline.";
                }
                else
                {
                    ErrorMessage = "Không có kết nối và không có dữ liệu offline.";
                }
            }
            catch (Exception dbEx)
            {
                ErrorMessage += $" Lỗi DB: {dbEx.Message}";
            }
        }
        finally
        {
            IsLoading = false;
            Console.WriteLine($"[DEBUG] LoadProductsAsync finished. Products count: {Products.Count}");
        }
    }

    [RelayCommand]
    private async Task NavigateToProductDetailAsync(Product product)
    {
        if (product == null) return;
        Console.WriteLine($"[DEBUG] Product Clicked. ID: {product.ProductId}");
        System.Diagnostics.Debug.WriteLine($"[DEBUG] Product Clicked. ID: {product.ProductId}");

        // Show a dialog or toast if possible, or just log for now as requested "trả về id"
        // For demonstration, we can change the title or show a message
        // await _navigator.ShowMessageDialogAsync(this, title: "Product ID", content: $"{product.ProductId}");
    }
}

