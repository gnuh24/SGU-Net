using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Models;
using RetailMobile.Models.Order;
using RetailMobile.Models.Payment;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class PaymentProcessingViewModel:ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

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

    public PaymentProcessingViewModel(
        INavigator navigator,
        ApiClient apiClient)
    {
        _navigator = navigator;
        _apiClient = apiClient;
    }

    [ObservableProperty]
    private string _paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/Transaction/PaymentMethod.html?token=5cab9572da4547748527f4c6d5186848";

    public void Initialize(Object parameter)
    {
        if (parameter is Dictionary<string, object> data)
        {
            if (data.TryGetValue("OrderForm", out object orderObj) && orderObj is OrderCreateDto orderForm)
            {
                OrderData = orderForm;
            }

            if (data.TryGetValue("Total", out object TotalObj) && TotalObj is decimal Total)
            {
                TotalAmount = Total;
            }

            if (data.TryGetValue("Discount", out object DiscountObj) && DiscountObj is decimal Discount)
            {
                DiscountAmount = Discount;
            }

            if (data.TryGetValue("Final", out object FinalObj) && FinalObj is decimal Final)
            {
                FinalAmount = Final;
            }
        }
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

}
