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


    public CartViewModel(
        INavigator navigator
    )
    {
        _navigator = navigator;
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
