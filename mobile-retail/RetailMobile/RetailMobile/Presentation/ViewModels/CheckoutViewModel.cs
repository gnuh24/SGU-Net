using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Kiota.Abstractions;
using RetailMobile.Helpers;
using RetailMobile.Models.Order;
using RetailMobile.Models.Payment;
using RetailMobile.Models.Promotion;
using RetailMobile.Services;
using Uno.Extensions.Navigation;

namespace RetailMobile.Presentation.ViewModels;

public partial class CheckoutViewModel:ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

    private readonly CartService _cartService;

    private readonly TokenService _tokenService;

    [ObservableProperty]
    private List<CartItem> _cartItems = new();

    [ObservableProperty]
    private List<PromotionDTO> _promotions = new();

    [ObservableProperty]
    private decimal _totalAmount = 0;

    [ObservableProperty]
    private int _selectedPromotion;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(PlaceOrderCommand))]
    private string _customerName;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(PlaceOrderCommand))]
    private string _phoneNumber;

    [ObservableProperty]
    private string _emailAddress;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(PlaceOrderCommand))]
    private string _deliveryAddress;

    [ObservableProperty]
    private bool _isAuthenticated;

    public CheckoutViewModel(INavigator navigator, ApiClient apiClient, CartService cartService, TokenService tokenService)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
        _tokenService = tokenService;

        CheckUserAuthenticationCommand.ExecuteAsync(null);
        _ = LoadCheckoutDataAsync();
    }

    public decimal DiscountAmount
    {
        get
        {
            if (SelectedPromotion != 0)
            {
                var promo = Promotions.FirstOrDefault(p=>p.PromoId == SelectedPromotion);
                if (promo == null)
                {
                    return 0;
                }
                if (promo.DiscountType == "Percentage")
                {
                    return TotalAmount * (promo.DiscountValue / 100);
                }
                else if (promo.DiscountType == "FixedAmount")
                {
                    return promo.DiscountValue;
                }
            }
            return 0;
        }
    }

    public decimal FinalAmount
    {
        get
        {
            return TotalAmount - DiscountAmount;
        }
    }
    public Visibility DiscountVisibility
    {
        get
        {
            return DiscountAmount > 0 ? Visibility.Visible : Visibility.Collapsed;
        }
    }

    public string FormattedTotalAmount
    {
        get
        {
            return TotalAmount.ToString("N0", new CultureInfo("vi-VN")).Append("₫");
        }
    }

    public string FormattedDiscountAmount
    {
        get
        {
            return DiscountAmount.ToString("N0", new CultureInfo("vi-VN")).Append("₫");
        }
    }
    public string FormattedFinalAmount
    {
        get
        {
            return FinalAmount.ToString("N0", new CultureInfo("vi-VN")).Append("₫");
        }
    }

    partial void OnSelectedPromotionChanged(int oldValue, int newValue)
    {
        OnPropertyChanged(nameof(DiscountAmount));
        OnPropertyChanged(nameof(FinalAmount));
        OnPropertyChanged(nameof(DiscountVisibility));
        OnPropertyChanged(nameof(FormattedDiscountAmount));
        OnPropertyChanged(nameof(FormattedFinalAmount));

    }

    partial void OnTotalAmountChanged(decimal oldValue, decimal newValue)
    {
        OnPropertyChanged(nameof(DiscountAmount));
        OnPropertyChanged(nameof(FinalAmount));
        OnPropertyChanged(nameof(DiscountVisibility));
        OnPropertyChanged(nameof(FormattedDiscountAmount));
        OnPropertyChanged(nameof(FormattedFinalAmount));
    }

    [RelayCommand]
    private async Task CheckUserAuthenticationAsync()
    {        
        string token = await _tokenService.GetAccessTokenAsync();

        if (token.IsNullOrEmpty())
        {
            IsAuthenticated = false;
        }
        else
        {
            //var queryParams = QueryHelper.ToQueryParams(("id", 1));
            //CustomerResponseDTO customer = await _apiClient.GetAsync<CustomerResponseDTO>("api/v1/customers", queryParams);
            CustomerResponseDTO customer = new CustomerResponseDTO();
            customer.CustomerId = 1;
            customer.Name = "Nguyen Van A";
            customer.Phone = "0123456789";
            customer.Email = "test@gmail.com";
            customer.Address = "123 Le Loi, District 1, HCM City";

            bool flag = customer != null;
            if (flag)
            {
                CustomerName = customer.Name;
                PhoneNumber = customer.Phone;
                EmailAddress = customer.Email;
                DeliveryAddress = customer.Address;
            }
            IsAuthenticated = flag;
        }

        Console.WriteLine($"User authenticated: {IsAuthenticated}");
    }

    [RelayCommand(CanExecute = nameof(CanPlaceOrder))]
    private async Task PlaceOrderAsync()
    {
        Console.WriteLine($"Đặt hàng được xác nhận!");
        Console.WriteLine($"Khách hàng: {CustomerName}, SĐT: {PhoneNumber}");
        Console.WriteLine($"Địa chỉ: {DeliveryAddress}");
        Console.WriteLine($"Thành tiền: {FinalAmount}");
        Console.WriteLine($"Khuyến mãi áp dụng: {SelectedPromotion}");
        Console.WriteLine($"Giam {DiscountAmount}");

        // Tạo khách hàng mới
        //CustomerResponseDTO customer = await CreateCustomerAsync();

        //Console.WriteLine($"Khách hàng được tạo với ID: {customer.CustomerId}");

        CustomerResponseDTO customer = await CreateCustomerAsync();

        // Tạo đơn hàng

        List<OrderItemCreateDto> orderItems = CartItems.Select(item => new OrderItemCreateDto
        {
            ProductId = item.ProductId,
            Quantity = item.Quantity
        }).ToList();

        OrderCreateDto orderForm = new OrderCreateDto();

        orderForm.CustomerId = customer.CustomerId;
        orderForm.UserId = null; // Chưa có user đăng nhập
        orderForm.PromoId = SelectedPromotion != 0 ? SelectedPromotion : null;
        orderForm.Status = "Pending";
        orderForm.OrderItems = orderItems;

        var navigationData = new Dictionary<string, object?>
        {
            { "OrderForm", orderForm },
            { "Total", TotalAmount },
            { "Discount", DiscountAmount },
            { "Final", FinalAmount },
        };

        await _navigator.NavigateViewModelAsync<PaymentProcessingViewModel>(this, data: navigationData);

        //OrderResponseDTO createdOrder = await _apiClient.PostAsync<OrderCreateDto, OrderResponseDTO>("/api/v1/orders", orderForm);

        //Console.WriteLine($"Đơn hàng được tạo với ID: {createdOrder}");

        //if (createdOrder == null)
        //{
        //    return;
        //}
    }

    private bool CanPlaceOrder()
    {
        bool hasCustomerInfo = !string.IsNullOrWhiteSpace(CustomerName) &&
                               !string.IsNullOrWhiteSpace(PhoneNumber) &&
                               !string.IsNullOrWhiteSpace(DeliveryAddress);

        return hasCustomerInfo;
    }
    
    public async Task<CustomerResponseDTO> CreateCustomerAsync()
    {
        CustomerCreateForm createForm = new CustomerCreateForm();
        createForm.Name = _customerName;
        createForm.Phone = _phoneNumber;
        createForm.Email = _emailAddress;
        createForm.Address = _deliveryAddress;

        CustomerResponseDTO customer = await _apiClient.PostAsync<CustomerCreateForm, CustomerResponseDTO>("/api/v1/customers", createForm);

        return customer;
    }

    [RelayCommand]
    public async Task LoadCheckoutDataAsync()
    {

        //CartItems = await _cartService.GetCartAsync();
        //TotalAmount = CartItems.Sum(item => item.Price * item.Quantity);
        //Promotions = await _apiClient.GetAsync<List<PromotionDTO>>("/api/v1/promotions/available",QueryHelper.ToQueryParams(("orderAmount", TotalAmount)));
        
        await _cartService.ClearCart(); // Xóa giỏ hàng trước khi load lại

        await LoadCartData(); // Tải dữ liệu mẫu vào giỏ hàng

        CartItems = await _cartService.GetCartAsync();

        TotalAmount = CartItems.Sum(item => item.Price * item.Quantity);

        try
        {
            Promotions = await _apiClient.GetAsync<List<PromotionDTO>>(
                "/api/v1/promotions/available",
                QueryHelper.ToQueryParams(("orderAmount", TotalAmount))
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine("API error loading promotions: " + ex.Message);

            // 5) Mock fallback nếu API lỗi
            Promotions = new List<PromotionDTO>
        {
            new PromotionDTO
            {
                PromoId = 0,
                PromoCode = "SALE0",
                DiscountType = "Percentage",
                DiscountValue = 0,
                Description = "Giảm 0%",
                StartDate = DateTime.Now.AddDays(-5),
                EndDate = DateTime.Now.AddDays(10),
                MinOrderAmount = 0,
                UsageLimit = 100,
                UsedCount = 20,
                Status = "Active"
            },
            new PromotionDTO
            {
                PromoId = 1,
                PromoCode = "SALE10",
                DiscountType = "Percentage",
                DiscountValue = 10,
                Description = "Giảm 10%",
                StartDate = DateTime.Now.AddDays(-5),
                EndDate = DateTime.Now.AddDays(10),
                MinOrderAmount = 50000,
                UsageLimit = 100,
                UsedCount = 20,
                Status = "Active"
            },
            new PromotionDTO
            {
                PromoId = 2,
                PromoCode = "FIX20K",
                DiscountType = "FixedAmount",
                DiscountValue = 20000,
                Description = "Giảm 20.000đ",
                StartDate = DateTime.Now.AddDays(-3),
                EndDate = DateTime.Now.AddDays(7),
                MinOrderAmount = 100000,
                UsageLimit = 50,
                UsedCount = 10,
                Status = "Active"
            }
        };
        }
    }

    private async Task LoadCartData()
    {
        var sampleCartItems = new List<CartItem>
        {
            new CartItem { ProductId = 1, Name = "Nokia 3310", Quantity = 1, Price = 49999m },
            new CartItem { ProductId = 2, Name = "iPhone 15 Pro", Quantity = 2, Price = 99999m },
            new CartItem { ProductId = 3, Name = "Samsung Galaxy S24", Quantity = 1, Price = 89999m },
            new CartItem { ProductId = 4, Name = "Xiaomi Redmi Note 13", Quantity = 3, Price = 19950m },
            new CartItem { ProductId = 5, Name = "Oppo Reno 11", Quantity = 1, Price = 45000m },
            new CartItem { ProductId = 6, Name = "Vivo V30", Quantity = 2, Price = 52000m },
            new CartItem { ProductId = 7, Name = "MacBook Air M2", Quantity = 1, Price = 119900m },
            new CartItem { ProductId = 8, Name = "iPad Pro 12.9", Quantity = 1, Price = 129900m },
            new CartItem { ProductId = 9, Name = "Sony Headphones WH-1000XM5", Quantity = 2, Price = 34999m },
            new CartItem { ProductId = 10, Name = "Logitech MX Master 3S", Quantity = 1, Price = 9999m }
        };

        foreach (var item in sampleCartItems)
        {
            _ = await _cartService.AddItemAsync(item);
        }
    }
}
