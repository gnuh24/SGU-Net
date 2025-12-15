using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RetailMobile.Models;
using RetailMobile.Models.Order;
using RetailMobile.Models.Payment;
using RetailMobile.Presentation.ViewModels;
using RetailMobile.Services;
using Windows.ApplicationModel.Payments;

namespace RetailMobile.Presentation.ViewModels;

public partial class PaymentProcessingViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

    private readonly ICartService _cartService;

    [ObservableProperty]
    private OrderCreateDto _orderData;

    [ObservableProperty]
    private decimal _totalAmount;

    [ObservableProperty]
    private decimal _discountAmount;

    [ObservableProperty]
    private decimal _finalAmount;

    [ObservableProperty]
    private PaymentMethod _selectedPaymentMethod = PaymentMethod.cash;

    [ObservableProperty]
    private bool _isNoProcessing = true;

    public PaymentProcessingViewModel(
        INavigator navigator,
        ApiClient apiClient,
        ICartService cartService,
        PaymentProcessingData paymentProcessingData)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _cartService = cartService;
        OrderData = paymentProcessingData.OrderData;
        TotalAmount = paymentProcessingData.TotalAmount;
        DiscountAmount = paymentProcessingData.DiscountAmount;
        FinalAmount = paymentProcessingData.FinalAmount;
    }
    public bool IsCashSelected => SelectedPaymentMethod == PaymentMethod.cash;

    public bool IsCardSelected => SelectedPaymentMethod == PaymentMethod.card;

    public bool IsBankTransferSelected => SelectedPaymentMethod == PaymentMethod.bank_transfer;

    public bool IsMomoSelected => SelectedPaymentMethod == PaymentMethod.momo;

    public bool IsVnpaySelected => SelectedPaymentMethod == PaymentMethod.vnpay;

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
                Console.WriteLine(method.ToString());
            }
        }
    }

    [RelayCommand]
    private async Task PlaceOrderAsync()
    {
        IsNoProcessing = false;

        //await _navigator.NavigateViewModelAsync<WebViewViewModel>(this, data: new WebViewData(1, "https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder") );

        OrderData.PaymentMethod = SelectedPaymentMethod.ToString();

        try
        {
            ApiResponse<OrderResponseDTO> orderResponse = await _apiClient.PostAsync<OrderCreateDto, ApiResponse<OrderResponseDTO>>("api/v1/orders/create", OrderData);

            if (orderResponse != null && orderResponse.Data != null)
            {
                _ = await _cartService.ClearCart();
                // api/ v1/payments momo/create vnpay/create
                if (SelectedPaymentMethod == PaymentMethod.vnpay)
                {
                    VNPayPaymentRequest paymentRequest = new VNPayPaymentRequest
                    {
                        OrderId = orderResponse.Data.OrderId,
                        Amount = FinalAmount,
                        ReturnUrl = "retailmobile://payment/result"
                    };
                    ApiResponse<VNPayPaymentResponse> paymentResponse = await _apiClient.PostAsync<VNPayPaymentRequest, ApiResponse<VNPayPaymentResponse>>("api/v1/payments/vnpay/create", paymentRequest);

                    if (paymentResponse != null && paymentResponse.Status == 200)
                    {
                        await _navigator.NavigateViewModelAsync<WebViewViewModel>(this, data: new WebViewData(paymentResponse.Data!.OrderId, paymentResponse.Data!.PaymentUrl));
                    }
                }
                else if (SelectedPaymentMethod == PaymentMethod.momo)
                {
                    MoMoPaymentRequest paymentRequest = new MoMoPaymentRequest
                    {
                        OrderId = orderResponse.Data.OrderId,
                        Amount = FinalAmount,
                        ReturnUrl = "retailmobile://payment/result"
                    };
                    ApiResponse<MoMoPaymentResponse> paymentResponse = await _apiClient.PostAsync<MoMoPaymentRequest, ApiResponse<MoMoPaymentResponse>>("api/v1/payments/momo/create", paymentRequest);

                    if (paymentResponse != null && paymentResponse.Status == 200)
                    {
                        await _navigator.NavigateViewModelAsync<WebViewViewModel>(this, data: new WebViewData(paymentResponse.Data!.OrderId, paymentResponse.Data!.PayUrl));
                    }
                }
                else if (SelectedPaymentMethod == PaymentMethod.cash)
                {
                    await _navigator.NavigateViewModelAsync<OrderConfirmationViewModel>(this, data: new Dictionary<string, string> { { "orderId", "0"}, { "resultCode", "0"}, { "message", "Đặt hàng thành công." } });
                }
            }
        }
        catch (Exception ex)
        {
            // Handle exceptions (e.g., show error message to user)
            Console.WriteLine($"Error placing order: {ex.Message}");
        }
    }

    [RelayCommand]
    public async Task GoBackAsync()
    {
        await _navigator.NavigateBackAsync(this);
    }
}
