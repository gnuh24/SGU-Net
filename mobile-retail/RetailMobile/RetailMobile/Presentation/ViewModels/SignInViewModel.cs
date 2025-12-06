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

    public SignInViewModel(
        INavigator navigator,
        ApiClient apiClient)
    {
        _navigator = navigator;
        _apiClient = apiClient;
    }

    [RelayCommand]
    public async Task NavigateToSignUpPageAsync()
    {
        await _navigator.NavigateViewModelAsync<SignUpViewModel>(this);
    }
}
