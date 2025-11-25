using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using RetailMobile.Models;

namespace RetailMobile.Presentation;

public sealed partial class ProductListPage : Page
{
    public ProductListPage()
    {
        this.InitializeComponent();
    }

    private async void OnPageLoaded(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (DataContext is ProductListViewModel viewModel)
        {
            await viewModel.OnNavigatedToAsync();
        }
    }

    private void OnSearchKeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter)
        {
            if (DataContext is ProductListViewModel viewModel)
            {
                _ = viewModel.SearchCommand.ExecuteAsync(null);
            }
        }
    }

    private void OnProductItemClick(object sender, ItemClickEventArgs e)
    {
        if (e.ClickedItem is Product product)
        {
            if (DataContext is ProductListViewModel viewModel)
            {
                _ = viewModel.NavigateToProductDetailCommand.ExecuteAsync(product);
            }
        }
    }

    private async void OnFilterOrSortChanged(object sender, Microsoft.UI.Xaml.Controls.SelectionChangedEventArgs e)
    {
        if (DataContext is ProductListViewModel viewModel)
        {
            await viewModel.LoadProductsAsync();
        }
    }
}
