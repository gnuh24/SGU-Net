using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class OrderConfirmationViewModel
{
    private INavigator _navigator;

    private ApiClient _apiClient;

    public OrderConfirmationViewModel(
        INavigator navigator,
        ApiClient apiClient)
    {
        _navigator = navigator;
        _apiClient = apiClient;
    }
}
