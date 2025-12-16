using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;


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

    // =====================
    // 🔑 PROPERTIES
    // =====================
    [ObservableProperty] private string? _username;
    [ObservableProperty] private string? _fullname;
    [ObservableProperty] private string? _phone;
    [ObservableProperty] private string? _password;
    [ObservableProperty] private string? _confirmPassword;

   [RelayCommand]
    public async Task RegisterAsync()
    {
        try
        {
            // 1️⃣ Validate input
            if (string.IsNullOrWhiteSpace(Username))
            {
                await ShowAlertAsync("Thiếu thông tin", "Vui lòng nhập Username");
                return;
            }

            if (string.IsNullOrWhiteSpace(Fullname))
            {
                await ShowAlertAsync("Thiếu thông tin", "Vui lòng nhập Fullname");
                return;
            }

            if (string.IsNullOrWhiteSpace(Phone))
            {
                await ShowAlertAsync("Thiếu thông tin", "Vui lòng nhập Phone");
                return;
            }

            if (string.IsNullOrWhiteSpace(Password))
            {
                await ShowAlertAsync("Thiếu thông tin", "Vui lòng nhập Password");
                return;
            }

            if (string.IsNullOrWhiteSpace(ConfirmPassword))
            {
                await ShowAlertAsync("Thiếu thông tin", "Vui lòng nhập Confirm Password");
                return;
            }

            if (Password != ConfirmPassword)
            {
                await ShowAlertAsync("Lỗi mật khẩu", "Password và Confirm Password không khớp");
                return;
            }

            // 2️⃣ Call API
            var response = await _apiClient.PostAsync<
                object,
                ApiResponse<object>
            >(
                "/api/v1/auth/register",
                new
                {
                    username = Username,
                    fullname = Fullname,
                    phone = Phone,
                    password = Password
                }
            );

            if (response == null)
            {
                await ShowAlertAsync("Lỗi", "Không nhận được phản hồi từ server");
                return;
            }

            if (response.Status != 200)
            {
                await ShowAlertAsync(
                    "Đăng ký thất bại",
                    response.Message ?? "Có lỗi xảy ra"
                );
                return;
            }

            // 3️⃣ Thành công
            await ShowAlertAsync("Thành công", "Tạo tài khoản thành công 🎉");

            // 4️⃣ Navigate
            await _navigator.NavigateViewModelAsync<SignInViewModel>(this);
        }
        catch (Exception ex)
        {
            await ShowAlertAsync("Lỗi hệ thống", ex.Message);
        }
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



    [RelayCommand]
    public async Task NavigateToSignInPageAsync()
    {
        await _navigator.NavigateViewModelAsync<SignInViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    public async Task NavigateToProductListPageAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
