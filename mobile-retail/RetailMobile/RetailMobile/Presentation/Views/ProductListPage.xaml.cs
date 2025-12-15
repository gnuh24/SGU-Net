using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using RetailMobile.Models;

namespace RetailMobile.Presentation;

public sealed partial class ProductListPage : Page
{
    public ProductListPage()
    {
        this.InitializeComponent();
        this.DataContextChanged += OnDataContextChanged;
    }

    private async void OnDataContextChanged(Microsoft.UI.Xaml.FrameworkElement sender, Microsoft.UI.Xaml.DataContextChangedEventArgs args)
    {
        System.Diagnostics.Debug.WriteLine("[ProductListPage] DataContextChanged");
        Console.WriteLine("[ProductListPage] DataContextChanged");

        if (DataContext is ProductListViewModel viewModel)
        {
            System.Diagnostics.Debug.WriteLine($"[ProductListPage] ViewModel found. Current Products count: {viewModel.Products.Count}");
            Console.WriteLine($"[ProductListPage] ViewModel found. Current Products count: {viewModel.Products.Count}");

            await viewModel.OnNavigatedToAsync();

            System.Diagnostics.Debug.WriteLine($"[ProductListPage] After OnNavigatedToAsync. Products count: {viewModel.Products.Count}");
            Console.WriteLine($"[ProductListPage] After OnNavigatedToAsync. Products count: {viewModel.Products.Count}");
            Console.WriteLine($"[ProductListPage] IsLoading: {viewModel.IsLoading}");
            Console.WriteLine($"[ProductListPage] ErrorMessage: {viewModel.ErrorMessage ?? "null"}");
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("[ProductListPage] DataContext is still null or wrong type");
            Console.WriteLine($"[ProductListPage] DataContext type: {DataContext?.GetType().Name ?? "null"}");
        }
    }

    private async void OnSearchKeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter)
        {
            if (DataContext is ProductListViewModel viewModel)
            {
                _ = viewModel.SearchCommand.ExecuteAsync(null);
            }
        }
    }

    private void OnProductItemClick(object sender, TappedRoutedEventArgs e)
    {
        if (sender is Microsoft.UI.Xaml.FrameworkElement element && element.DataContext is Product product)
        {
            Frame.Navigate(typeof(ProductDetailPage), product);
        }
    }

    private async void OnFilterOrSortChanged(object sender, Microsoft.UI.Xaml.Controls.SelectionChangedEventArgs e)
    {
        if (DataContext is ProductListViewModel viewModel)
        {
            await viewModel.LoadProductsAsync();
        }
    }

    private async void OnSortOptionClick(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (sender is MenuFlyoutItem item && item.Tag is string sortOption)
        {
            if (DataContext is ProductListViewModel viewModel)
            {
                viewModel.SelectedSortOption = sortOption;
                await viewModel.LoadProductsAsync();
            }
        }
    }

    private async void OnCategoryFilterClick(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (sender is MenuFlyoutItem item && item.Tag is string category)
        {
            if (DataContext is ProductListViewModel viewModel)
            {
                viewModel.SelectedCategory = category;
                await viewModel.LoadProductsAsync();
            }
        }
    }
}
