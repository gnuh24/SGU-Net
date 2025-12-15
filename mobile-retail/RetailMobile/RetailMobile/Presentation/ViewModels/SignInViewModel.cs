using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;
using RetailMobile.Models.Auth;
using RetailMobile.Models;

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
                Console.WriteLine("❌ Username hoặc Password trống");
                return;
            }

            var response = await _apiClient.PostAsync<
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

            // 2️⃣ Validate response wrapper
            if (response == null)
            {
                Console.WriteLine("❌ Response null");
                return;
            }

            if (response.Data == null)
            {
                Console.WriteLine("❌ Response.Data null");
                Console.WriteLine($"Status  : {response.Status}");
                Console.WriteLine($"Message : {response.Message}");
                return;
            }

            if (string.IsNullOrEmpty(response.Data.AccessToken))
            {
                Console.WriteLine("❌ Login failed - AccessToken empty");
                Console.WriteLine($"Message : {response.Message}");
                return;
            }

            // 3️⃣ Log wrapper info
            Console.WriteLine("✅ LOGIN SUCCESS");
            Console.WriteLine($"Status  : {response.Status}");
            Console.WriteLine($"Message : {response.Message}");

            // 4️⃣ Log AuthResponse (DATA)
            Console.WriteLine("----- AUTH DATA -----");
            Console.WriteLine($"UserId       : {response.Data.UserId}");
            Console.WriteLine($"Username     : {response.Data.Username}");
            Console.WriteLine($"FullName     : {response.Data.FullName}");
            Console.WriteLine($"Role         : {response.Data.Role}");
            Console.WriteLine($"AccessToken  : {response.Data.AccessToken}");
            Console.WriteLine($"RefreshToken : {response.Data.RefreshToken}");


            await _tokenService.SaveAuthAsync(response.Data);
       
            // 5️⃣ Navigate sau khi login
            await _navigator.NavigateViewModelAsync<ProductListViewModel>(this);
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ UNEXPECTED ERROR");
            Console.WriteLine(ex);
        }
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
