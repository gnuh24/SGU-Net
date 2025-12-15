using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;
using RetailMobile.Models.Auth;
using RetailMobile.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace RetailMobile.Presentation.ViewModels;

public partial class SignInViewModel:ObservableObject
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    private readonly CartService _cartService;

    private ITokenService _tokenService;



    public SignInViewModel(
        INavigator navigator,
        ApiClient apiClient,
        CartService cartService,
        ITokenService tokenService)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
        _tokenService = tokenService;
    }

    private async Task ShowAlertAsync(string title, string message)
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = message,
            CloseButtonText = "OK",
            XamlRoot = Window.Current.Content.XamlRoot
        };

        await dialog.ShowAsync();
    }

    // =====================
    // 🔑 INPUT PROPERTIES
    // =====================
    [ObservableProperty]
    private string? username;

    [ObservableProperty]
    private string? password;

    [RelayCommand]
    public async Task LoginAsync()
    {
        try
        {
            // 1️⃣ Validate input
            if (string.IsNullOrWhiteSpace(Username) ||
                string.IsNullOrWhiteSpace(Password))
            {
                await ShowAlertAsync(
                    "Thiếu thông tin",
                    "Vui lòng nhập đầy đủ Username và Password"
                );
                return;
            }


            var response = await _apiClient.PostRawAsync<
                object,
                ApiResponse<AuthResponse>
            >(
                "/api/v1/auth/login",
                new
                {
                    username = Username,
                    password = Password
                }
            );



            // 2️⃣ Response null (lỗi bất thường)
            if (response == null)
            {
                await ShowAlertAsync(
                    "Lỗi hệ thống",
                    "Không nhận được phản hồi từ máy chủ"
                );
                return;
            }



            // 3️⃣ ❗ Lỗi nghiệp vụ (401, 403, ...)
            if (response.Data == null || string.IsNullOrEmpty(response.Data.AccessToken))
            {
                await ShowAlertAsync(
                    "Đăng nhập thất bại",
                    response.Message ?? "Đã xảy ra lỗi khi đăng nhập"
                );
                return;
            }

            // 4️⃣ Login thành công
            Console.WriteLine("✅ LOGIN SUCCESS");
            Console.WriteLine($"UserId   : {response.Data.UserId}");
            Console.WriteLine($"Username : {response.Data.Username}");
            Console.WriteLine($"Role     : {response.Data.Role}");

            await _tokenService.SaveAuthAsync(response.Data);

            // 5️⃣ Navigate
            await _navigator.NavigateViewModelAsync<ProductListViewModel>(this);
        }
      catch (Exception ex)
        {
        

            await ShowAlertAsync(
                "Lỗi hệ thống",
                ex.Message
            );
        }

    }





    [RelayCommand]
    public async Task NavigateToSignUpPageAsync()
    {
        await _navigator.NavigateViewModelAsync<SignUpViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    public async Task NavigateToProductListPageAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
