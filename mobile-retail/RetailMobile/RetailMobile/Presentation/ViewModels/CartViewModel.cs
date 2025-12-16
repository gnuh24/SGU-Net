using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Presentation.Views;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class CartViewModel:ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ICartService _cartService;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(TotalAmount))]
    [NotifyPropertyChangedFor(nameof(TotalQuantity))]
    [NotifyPropertyChangedFor(nameof(HasSelectedItems))]
    private ObservableCollection<CartItemViewModel> cartItems = new();

    public decimal TotalAmount => CartItems.Sum(item => item.Quantity * item.Price);
    public string TotalAmountFormatted => $"{TotalAmount:N0}₫";
    public decimal TotalQuantity => CartItems.Sum(item => item.Quantity);
    public bool HasSelectedItems => CartItems.Any(x => x.IsSelected);

    public CartViewModel(
        INavigator navigator,
        ICartService cartService
    )
    {
        _navigator = navigator;
        _cartService = cartService;

        _ = LoadDataAsync();
    }

    private async Task LoadDataAsync()
    {
        var list = await _cartService.GetCartAsync() ?? new List<CartItem>();


        CartItems = new ObservableCollection<CartItemViewModel>(
            list.Select(x => new CartItemViewModel(x))
        );

        NotifyPropertyChanged();
    }

    private void NotifyPropertyChanged()
    {
        OnPropertyChanged(nameof(TotalAmount));
        OnPropertyChanged(nameof(TotalQuantity));
        OnPropertyChanged(nameof(TotalAmountFormatted));
        OnPropertyChanged(nameof(HasSelectedItems));
    }

    [RelayCommand]
    private async Task IncreaseQuantityAsync(int productId)
    {
        var item = CartItems.FirstOrDefault(x => x.ProductId == productId);

        if (item == null) return;

        item.Quantity+=1;
        item.SyncToModel();

        await _cartService.UpdateItemAsync(item.Model);

        NotifyPropertyChanged();
    }

    [RelayCommand]
    private async Task DecreaseQuantityAsync(int productId)
    {
        var item = CartItems.FirstOrDefault(x => x.ProductId == productId);

        if (item == null) return;

        if (item.Quantity <= 1)
            return;

        item.Quantity-=1;
        item.SyncToModel();

        await _cartService.UpdateItemAsync(item.Model);

        NotifyPropertyChanged();
    }

    [RelayCommand]
    private async Task RemoveSelectedItemsAsync()
    {
        var selectedItems = CartItems
            .Where(x => x.IsSelected)
            .ToList();

        if (!selectedItems.Any())
            return;

        foreach (var item in selectedItems)
        {
            CartItems.Remove(item);
            await _cartService.RemoveItemAsync(item.Model);
        }

        NotifyPropertyChanged();        
    }

    [RelayCommand]
    private async Task NavigateToCheckoutAsync()
    {
        await _navigator.NavigateViewModelAsync<CheckoutViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToProductListAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToProfileAsync()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
