using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Models;
using RetailMobile.Models.Order;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class PaymentProcessingViewModel
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    public PaymentProcessingViewModel(
        INavigator navigator,
        ApiClient apiClient)
    {
        _navigator = navigator;
        _apiClient = apiClient;
    }

    private string _paymentUrl;
    public string PaymentUrl
    {
        get => _paymentUrl;
        set => PaymentUrl = value;
    }

    public async Task InitializeAsync(object data)
    {
        if (data is OrderResponseDTO createdOrder)
        {
            // Gửi request tạo payment
            //var response = await _apiClient.PostAsync<>(createdOrder);
            // response có field Url thanh toán
            //PaymentUrl = response.PaymentUrl;
        }
    }
}
