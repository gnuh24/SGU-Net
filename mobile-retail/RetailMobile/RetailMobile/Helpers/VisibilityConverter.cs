using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.UI.Xaml.Data;

namespace RetailMobile.Helpers;

public class InverseBooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is bool boolValue)
        {
            // Trả về Collapsed nếu là true, Visible nếu là false (đảo ngược)
            return boolValue ? Visibility.Collapsed : Visibility.Visible;
        }
        return Visibility.Visible; // Giá trị mặc định nếu binding lỗi
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}

public class BooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is bool boolValue)
        {
            // Trả về Collapsed nếu là true, Visible nếu là false (đảo ngược)
            return boolValue ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Visible; // Giá trị mặc định nếu binding lỗi
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}

