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

    private readonly ITokenService _tokenService;

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

    public CheckoutViewModel(INavigator navigator, ApiClient apiClient, CartService cartService, ITokenService tokenService)
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
            // Lay customer id o day
            var queryParams = QueryHelper.ToQueryParams(("id", 1));
            CustomerResponseDTO customer = await _apiClient.GetAsync<CustomerResponseDTO>("api/v1/customers", queryParams);

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

        // Tạo đơn hàng

        List<OrderItemCreateDto> orderItems = CartItems.Select(item => new OrderItemCreateDto
        {
            ProductId = item.ProductId,
            Quantity = item.Quantity
        }).ToList();

        OrderCreateDto orderForm = new OrderCreateDto();

        orderForm.CustomerId = 0;
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
                               !string.IsNullOrWhiteSpace(DeliveryAddress);

        return hasCustomerInfo;
    }
    
    public async Task<CustomerResponseDTO> CreateCustomerAsync()
    {
        CustomerCreateForm createForm = new CustomerCreateForm();
        createForm.Name = CustomerName;
        createForm.Phone = PhoneNumber;
        createForm.Email = EmailAddress;
        createForm.Address = DeliveryAddress;

        CustomerResponseDTO customer = await _apiClient.PostAsync<CustomerCreateForm, CustomerResponseDTO>("/api/v1/customers", createForm);

        return customer;
    }

    [RelayCommand]
    public async Task LoadCheckoutDataAsync()
    {

        CartItems = await _cartService.GetCartAsync();

        if (CartItems.Count() == 0)
        {
            Console.WriteLine("Giỏ hàng trống.");
            return;
        }

        TotalAmount = CartItems.Sum(item => item.Price * item.Quantity);

        try
        {
            Promotions = await _apiClient.GetAsync<List<PromotionDTO>>(
                "/api/v1/promotions/available",
                QueryHelper.ToQueryParams(("orderAmount", TotalAmount))
            );

            Promotions.Insert(0, new PromotionDTO
            {
                PromoId = 0,
                PromoCode = "No Promotion",
                Description = "No Promotion Applied",
                DiscountType = "None",
                DiscountValue = 0
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("API error loading promotions: " + ex.Message);
        }
    }
}
