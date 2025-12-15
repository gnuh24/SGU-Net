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

namespace RetailMobile.Presentation.ViewModels;

public partial class CheckoutViewModel:ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

    private readonly ICartService _cartService;

    private readonly ITokenService _tokenService;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(PlaceOrderCommand))]
    private List<CartItem> _cartItems = new();

    [ObservableProperty]
    private List<PromotionDTO> _promotions = new();

    [ObservableProperty]
    private decimal _totalAmount = 0;

    [ObservableProperty]
    private int _selectedPromotion = 0;

    private int CustomerId { get; set; }

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

    [ObservableProperty]
    private bool _isNotShipping = true;

    public CheckoutViewModel(INavigator navigator, ApiClient apiClient, ICartService cartService, ITokenService tokenService)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
        _tokenService = tokenService;

        _ = LoadInitialDataAsync();
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
                if (promo.DiscountType == "percent")
                {
                    return TotalAmount * (promo.DiscountValue / 100);
                }
                else if (promo.DiscountType == "fixed")
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
            return $"{TotalAmount:N0}₫";
        }
    }

    public string FormattedDiscountAmount
    {
        get
        {
            return $"{DiscountAmount:N0}₫";
        }
    }
    public string FormattedFinalAmount
    {
        get
        {
            return $"{FinalAmount:N0}₫";
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

    private async Task LoadInitialDataAsync()
    {
        await CheckUserAuthenticationAsync();
        await LoadCheckoutDataAsync();
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
            // Lay customer id o day
            var queryParams = QueryHelper.ToQueryParams(("id", 1));
            ApiResponse<CustomerResponseDTO> response = await _apiClient.GetAsync<ApiResponse<CustomerResponseDTO>>("api/v1/customers", queryParams);

            if (response != null)
            {
                CustomerId = response.Data!.CustomerId;
                CustomerName = response.Data?.Name ?? "";
                PhoneNumber = response.Data?.Phone ?? "";
                EmailAddress = response.Data?.Email ?? "";
                DeliveryAddress = response.Data?.Address ?? "";
            }
            IsAuthenticated = response != null;
        }

        Console.WriteLine($"User authenticated: {IsAuthenticated}");
    }

    [RelayCommand(CanExecute = nameof(CanPlaceOrder))]
    private async Task PlaceOrderAsync()
    {
        IsNotShipping = false;

        Console.WriteLine($"Đặt hàng được xác nhận!");
        Console.WriteLine($"Khách hàng: {CustomerName}, SĐT: {PhoneNumber}");
        Console.WriteLine($"Địa chỉ: {DeliveryAddress}");
        Console.WriteLine($"Thành tiền: {FinalAmount}");
        Console.WriteLine($"Khuyến mãi áp dụng: {SelectedPromotion}");
        Console.WriteLine($"Giam {DiscountAmount}");

        int finalCustomerId;

        if (IsAuthenticated)
        {
            finalCustomerId = CustomerId;
        }
        // Tạo khách hàng mới
        else        {
            CustomerResponseDTO? customer = await CreateCustomerAsync();
            finalCustomerId = customer?.CustomerId ?? 0;
        }

        // Tạo đơn hàng
        List<OrderItemCreateDto> orderItems = CartItems.Select(item => new OrderItemCreateDto
        {
            ProductId = item.ProductId,
            Quantity = item.Quantity
        }).ToList();

        OrderCreateDto orderForm = new OrderCreateDto();

        orderForm.CustomerId = finalCustomerId;
        orderForm.UserId = null;
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

        await _navigator.NavigateViewModelAsync<PaymentProcessingViewModel>(this, data: new PaymentProcessingData(orderForm, TotalAmount, DiscountAmount, FinalAmount));

    }

    private bool CanPlaceOrder()
    {
        bool hasCustomerInfo = !string.IsNullOrWhiteSpace(CustomerName) &&
                       !string.IsNullOrWhiteSpace(PhoneNumber) &&
                       !string.IsNullOrWhiteSpace(DeliveryAddress) &&
                       CartItems.Count > 0;

        return hasCustomerInfo;
    }
    
    public async Task<CustomerResponseDTO> CreateCustomerAsync()
    {
        CustomerCreateForm createForm = new CustomerCreateForm();
        createForm.Name = CustomerName;
        createForm.Phone = PhoneNumber;
        createForm.Email = EmailAddress;
        createForm.Address = DeliveryAddress;

        ApiResponse<CustomerResponseDTO> response = await _apiClient.PostAsync<CustomerCreateForm, ApiResponse<CustomerResponseDTO>>("/api/v1/customers", createForm);

        return response.Data!;
    }

    [RelayCommand]
    public async Task LoadCheckoutDataAsync()
    {

        CartItems = await _cartService.GetCartAsync();

        if (CartItems.Count == 0)
        {
            Console.WriteLine("Giỏ hàng trống.");
            return;
        }

        TotalAmount = CartItems.Sum(item => item.Price * item.Quantity);

        try
        {
            ApiResponse<List<PromotionDTO>> response = await _apiClient.GetAsync<ApiResponse<List<PromotionDTO>>>(
                "/api/v1/promotions/available",
                QueryHelper.ToQueryParams(("orderAmount", TotalAmount))
            );

            if (response != null && response.Data != null)
            {
                Promotions = response.Data;
                Promotions.ForEach(item => {
                    Console.WriteLine($"Id {item.PromoId} code {item.PromoCode} value {item.DiscountValue} type {item.DiscountType} description {item.Description}");
                } );
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("API error loading promotions: " + ex.Message);
        }
    }

    [RelayCommand]
    public async Task GoBackAsync()
    {
        await _navigator.NavigateBackAsync(this);
    }
}
