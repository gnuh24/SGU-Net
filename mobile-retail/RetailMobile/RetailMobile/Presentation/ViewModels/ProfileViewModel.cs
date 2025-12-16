using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;
using RetailMobile.Models;
using ZXing;
using ZXing.Common;
using Microsoft.UI.Xaml.Media.Imaging;
using System.Runtime.InteropServices.WindowsRuntime;

namespace RetailMobile.Presentation.ViewModels;

public partial class ProfileViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

    private readonly ITokenService _tokenService;


    public ProfileViewModel(
        INavigator navigator,
        ApiClient apiClient,
        ITokenService tokenService
    )
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _tokenService = tokenService;
        _ = LoadAsync();

    }

    [ObservableProperty] private string? fullname;
    [ObservableProperty] private string? phone;
    [ObservableProperty] private string? email;
    [ObservableProperty] private string? address;
    [ObservableProperty] private string? createdAt;
    [ObservableProperty] private int customerId;
    [ObservableProperty] private ImageSource? qrImage;


    [RelayCommand]
    private async Task SaveAsync()
    {
        try
        {
            if (customerId <= 0)
            {
                Console.WriteLine("❌ CustomerId invalid");
                return;
            }

            var payload = new
            {
                Name = fullname,
                Phone = phone,
                Email = email,
                Address = address
            };

            // Gọi API PUT với TRequest là payload, TResponse là ApiResponse<object>
            var response = await _apiClient.PutAsync<object, ApiResponse<object>>(
                $"/api/v1/customers/{customerId}",
                payload
            );

            if (response == null)
            {
                Console.WriteLine("❌ API response null");
                return;
            }

            if (response.Status == 200)
            {
                Console.WriteLine("✅ Customer updated successfully!");
            }

            else
            {
                Console.WriteLine($"❌ Failed: {response.Message}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }

    public async Task LoadAsync()
    {
        Console.WriteLine("🚀 LoadAsync START");

        var user = await _tokenService.GetAuthAsync();

        if (user == null)
        {
            Console.WriteLine("❌ Auth NULL – chưa login hoặc chưa có data trong SQLite");
            return;
        }

        // 🔹 In AuthResponse
        Console.WriteLine("----- AUTH FROM SQLITE -----");
        Console.WriteLine($"UserId       : {user.UserId}");
        Console.WriteLine($"Username     : {user.Username}");
        Console.WriteLine($"FullName     : {user.FullName}");
        Console.WriteLine($"Role         : {user.Role}");
        Console.WriteLine($"AccessToken  : {user.AccessToken}");
        Console.WriteLine($"RefreshToken : {user.RefreshToken}");

        // 🔹 Call API
        Console.WriteLine($"➡️ CALL API: /api/v1/users/{user.UserId}");

        var response = await _apiClient.GetAsync<
            ApiResponse<UserWithCustomerResponse>
        >($"/api/v1/users/{user.UserId}");

        if (response == null)
        {
            Console.WriteLine("❌ API response NULL");
            return;
        }

        Console.WriteLine("----- API RESPONSE -----");
        Console.WriteLine($"Status  : {response.Status}");
        Console.WriteLine($"Message : {response.Message}");

        if (response.Data == null)
        {
            Console.WriteLine("❌ response.Data NULL");
            return;
        }

        if (response.Data.Customer == null)
        {
            Console.WriteLine("❌ Customer NULL trong response.Data");
            return;
        }

        var customer = response.Data.Customer;

        // 🔹 In Customer
        Console.WriteLine("----- CUSTOMER DATA -----");
        Console.WriteLine($"CustomerId : {customer.CustomerId}");
        Console.WriteLine($"Name       : {customer.Name}");
        Console.WriteLine($"Phone      : {customer.Phone}");
        Console.WriteLine($"Email      : {customer.Email}");
        Console.WriteLine($"Address    : {customer.Address}");
        Console.WriteLine($"CreatedAt  : {customer.CreatedAt}");

        // 🔹 Bind vào UI
        Fullname = customer.Name;
        Phone = customer.Phone;
        Email = customer.Email;
        Address = customer.Address;
        CustomerId = customer.CustomerId;

        // format ngày cho đẹp
        CreatedAt = customer.CreatedAt.ToString("dd/MM/yyyy HH:mm");

        Console.WriteLine($"Name       : {Fullname}");
        Console.WriteLine($"Phone      : {Phone}");
        Console.WriteLine($"Email      : {Email}");
        Console.WriteLine($"Address    : {Address}");
        UpdateQr();

        Console.WriteLine("✅ LoadAsync DONE – Data bind thành công");
    }

    public void UpdateQr()
    {
        if (string.IsNullOrEmpty(CustomerId.ToString())) return;

        var writer = new BarcodeWriterPixelData
        {
            Format = BarcodeFormat.QR_CODE,
            Options = new EncodingOptions
            {
                Height = 140,
                Width = 140,
                Margin = 0
            }
        };

        // convert CustomerId to string
        var pixelData = writer.Write(CustomerId.ToString());

        var bmp = new WriteableBitmap(pixelData.Width, pixelData.Height);
        using (var stream = bmp.PixelBuffer.AsStream())
        {
            stream.Write(pixelData.Pixels, 0, pixelData.Pixels.Length);
        }

        QrImage = bmp; // QrImage phải là WriteableBitmap
    }

    [RelayCommand]
    private async Task NavigateToProductListAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToCartAsync()
    {
        await _navigator.NavigateViewModelAsync<CartViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
