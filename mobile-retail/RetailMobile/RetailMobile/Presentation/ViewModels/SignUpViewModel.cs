using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class SignUpViewModel: ObservableObject
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    public SignUpViewModel(
        INavigator navigator,
        ApiClient apiClient)
    {
        _navigator = navigator;
        _apiClient = apiClient;
    }

    [RelayCommand]
    public async Task NavigateToSignInPageAsync()
    {
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    public async Task NavigateToCheckoutPageAsync()
    {
        await _navigator.NavigateViewModelAsync<CheckoutViewModel>(this);
    }
}
