using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class SignInViewModel:ObservableObject
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    private readonly CartService _cartService;

    public SignInViewModel(
        INavigator navigator,
        ApiClient apiClient,
        CartService cartService)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
    }

    [RelayCommand]
    public async Task NavigateToSignUpPageAsync()
    {
        await _navigator.NavigateViewModelAsync<SignUpViewModel>(this);
    }

    [RelayCommand]
    public async Task NavigateToProductListPageAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this);
    }
}
