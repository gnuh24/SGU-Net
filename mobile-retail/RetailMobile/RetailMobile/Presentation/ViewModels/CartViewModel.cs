using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class CartViewModel
{
    private readonly INavigator _navigator;

    private readonly ICartService _cartService;

    public CartViewModel(
        INavigator navigator,
        ICartService cartService
    )
    {
        _navigator = navigator;
        _cartService = cartService;
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
