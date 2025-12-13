using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class OrderConfirmationViewModel:ObservableObject
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    [ObservableProperty]
    private string _orderId;

    [ObservableProperty]
    private string _resultCode;

    [ObservableProperty]
    private string _message;

    public bool IsSuccess => ResultCode == "0";

    public OrderConfirmationViewModel(
        INavigator navigator,
        ApiClient apiClient,
        Dictionary<string, string> queryParams)
    {
        _navigator = navigator;
        _apiClient = apiClient;
        LoadData(queryParams);
    }

    private void LoadData(Dictionary<string, string> queryParams)
    {
        // 1. Trích xuất và gán OrderId
        if (queryParams.TryGetValue("orderId", out var orderIdValue))
        {
            OrderId = orderIdValue;
        }

        // 2. Trích xuất và gán ResultCode
        if (queryParams.TryGetValue("resultCode", out var resultCodeValue))
        {
            ResultCode = resultCodeValue;
        }
        else
        {
            // Đặt giá trị mặc định nếu resultCode không tồn tại (ví dụ: lỗi không xác định)
            ResultCode = "-99";
        }

        // 3. Trích xuất và gán Message
        if (queryParams.TryGetValue("message", out var messageValue))
        {
            Message = messageValue;
        }
        else
        {
            Message = "Không tìm thấy thông báo giao dịch.";
        }

        OnPropertyChanged(nameof(IsSuccess));
    }

    [RelayCommand]
    public async Task NavigateToProductListPageAsync()
    {
        await _navigator.NavigateViewModelAsync<ProductListViewModel>(this);
    }
}
