using System;
using System.Collections.Generic;
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
    private INavigator _navigator;

    private ApiClient _apiClient;

    private CartService _cartService;

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
    [NotifyCanExecuteChangedFor(nameof(PlaceOrderCommand))]
    private PaymentMethod _selectedPaymentMethod = PaymentMethod.cash;

    public CheckoutViewModel(INavigator navigator, ApiClient apiClient, CartService cartService)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
        _ = LoadCheckoutDataAsync();
    }

    public bool IsCashSelected
    {
        get => SelectedPaymentMethod == PaymentMethod.cash;
        set => SelectPaymentMethod(PaymentMethod.cash);
    }

    public bool IsCardSelected
    {
        get => SelectedPaymentMethod == PaymentMethod.card;
        set => SelectPaymentMethod(PaymentMethod.card);
    }

    public bool IsBankTransferSelected
    {
        get => SelectedPaymentMethod == PaymentMethod.bank_transfer;
        set => SelectPaymentMethod(PaymentMethod.bank_transfer);
    }

    public bool IsMomoSelected
    {
        get => SelectedPaymentMethod == PaymentMethod.momo;
        set => SelectPaymentMethod(PaymentMethod.momo);
    }

    public bool IsVnpaySelected
    {
        get => SelectedPaymentMethod == PaymentMethod.vnpay;
        set => SelectPaymentMethod(PaymentMethod.vnpay);
    }

    partial void OnSelectedPaymentMethodChanged(PaymentMethod value)
    {
        OnPropertyChanged(nameof(IsCashSelected));
        OnPropertyChanged(nameof(IsCardSelected));
        OnPropertyChanged(nameof(IsBankTransferSelected));
        OnPropertyChanged(nameof(IsMomoSelected));
        OnPropertyChanged(nameof(IsVnpaySelected));
    }

    [RelayCommand]
    private void SelectPaymentMethod(object parameter)
    {
        if (parameter is string methodString &&
            Enum.TryParse<PaymentMethod>(methodString, true, out var method))
        {
            // Chỉ gán nếu phương thức được chọn khác với hiện tại để tránh loop
            if (SelectedPaymentMethod != method)
            {
                SelectedPaymentMethod = method;
            }
        }
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

    [RelayCommand(CanExecute = nameof(CanPlaceOrder))]
    private async Task PlaceOrderAsync()
    {
        Console.WriteLine($"Đặt hàng được xác nhận!");
        Console.WriteLine($"Khách hàng: {CustomerName}, SĐT: {PhoneNumber}");
        Console.WriteLine($"Địa chỉ: {DeliveryAddress}");
        Console.WriteLine($"Phương thức: {SelectedPaymentMethod}");
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
        orderForm.PaymentMethod = SelectedPaymentMethod.ToString();
        orderForm.OrderItems = orderItems;

        OrderResponseDTO createdOrder = await _apiClient.PostAsync<OrderCreateDto, OrderResponseDTO>("/api/v1/orders", orderForm);

        Console.WriteLine($"Đơn hàng được tạo với ID: {createdOrder}");

        if (createdOrder == null)
        {
            return;
        }

        await _cartService.ClearCart();
        switch (SelectedPaymentMethod)
        {
            case PaymentMethod.cash:
                await _navigator.NavigateViewModelAsync<OrderConfirmationViewModel>(this, data: createdOrder);
                break;
            case PaymentMethod.card:
            case PaymentMethod.bank_transfer:
            case PaymentMethod.momo:
            case PaymentMethod.vnpay:
                // Chuyển đến trang xử lý thanh toán tương ứng
                await _navigator.NavigateViewModelAsync<PaymentProcessingViewModel>(this, data: createdOrder);
                break;
        }
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

        if (!(await _cartService.GetCartAsync()).Any())
        {
            int c = await _cartService.AddItemAsync(new CartItem
            {
                ProductId = 1,
                Name = "Coca Cola 500ml",
                Quantity = 2,
                Price = 10000
            });

            c += await _cartService.AddItemAsync(new CartItem
            {
                ProductId = 2,
                Name = "Snack Oishi",
                Quantity = 1,
                Price = 15000
            });

        }


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
}
