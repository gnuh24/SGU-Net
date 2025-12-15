using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Navigation;
using RetailMobile.Models;
using RetailMobile.Services;

namespace RetailMobile.Presentation;

public sealed partial class ProductDetailPage : Page
{
    public ProductDetailViewModel ViewModel { get; }

    public ProductDetailPage()
    {
        this.InitializeComponent();

        // Get CartService from DI
        var cartService = (Application.Current as App)?.Host?.Services?.GetService(typeof(ICartService)) as ICartService;
        
        // Create ViewModel instance with CartService
        ViewModel = new ProductDetailViewModel(cartService ?? throw new InvalidOperationException("CartService not found"));
        this.DataContext = ViewModel;
    }

    protected override void OnNavigatedTo(NavigationEventArgs e)
    {
        base.OnNavigatedTo(e);

        if (e.Parameter is Product product)
        {
            ViewModel.SetProduct(product);
            System.Diagnostics.Debug.WriteLine($"[ProductDetailPage] Loaded product: {product.ProductName}, Price: {product.Price}");
        }
    }

    private void OnBackButtonClick(object sender, RoutedEventArgs e)
    {
        if (Frame.CanGoBack)
        {
            Frame.GoBack();
        }
    }

    private void OnIncreaseQuantityClick(object sender, RoutedEventArgs e)
    {
        ViewModel.IncreaseQuantity();
        System.Diagnostics.Debug.WriteLine($"[ProductDetailPage] Quantity increased to: {ViewModel.Quantity}");
    }

    private void OnDecreaseQuantityClick(object sender, RoutedEventArgs e)
    {
        ViewModel.DecreaseQuantity();
        System.Diagnostics.Debug.WriteLine($"[ProductDetailPage] Quantity decreased to: {ViewModel.Quantity}");
    }

    private async void OnAddToCartClick(object sender, RoutedEventArgs e)
    {
        var success = await ViewModel.AddToCartAsync();

        // Show confirmation dialog
        var dialog = new ContentDialog
        {
            Title = success ? "Thành công" : "Lỗi",
            Content = success 
                ? $"Đã thêm {ViewModel.Quantity}x {ViewModel.Product?.ProductName} vào giỏ hàng" 
                : "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.",
            CloseButtonText = "OK",
            XamlRoot = this.XamlRoot
        };
        await dialog.ShowAsync();
    }
}
