using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Models.Order;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class WebViewViewModel:ObservableObject
{
    private readonly INavigator _navigator;

    private readonly ApiClient _apiClient;

    [ObservableProperty]
    private string _paymentUrl;

    private string? OrderId { get; set; }

    public WebViewViewModel(
        INavigator navigator,
        ApiClient apiClient,
        WebViewData data)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        _paymentUrl = data.PaymentUrl;
        OrderId = data.OrderId;
    }

    [RelayCommand]
    private async Task CloseAsync()
    {
        await _navigator.NavigateBackAsync(this);
    }
}
