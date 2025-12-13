using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RetailMobile.Services;

namespace RetailMobile.Presentation.ViewModels;

public partial class WebViewViewModel:ObservableObject
{
    private readonly INavigator _navigator;


    [ObservableProperty]
    private string _paymentUrl;

    public WebViewViewModel(
        INavigator navigator)
    {
        _navigator = navigator;
    }

    public void Initialize(Object parameter)
    {
        if (parameter is string url)
        {
            _paymentUrl = url;
        }
    }
}
