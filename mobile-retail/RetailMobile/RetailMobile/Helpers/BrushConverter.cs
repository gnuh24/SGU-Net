using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.UI.Xaml.Data;

namespace RetailMobile.Helpers;

 public class BooleanToBrushConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is bool boolValue && boolValue)
        {
            // Trả về màu Đỏ (hoặc màu accent bạn muốn) khi IsChecked = true
            return new SolidColorBrush(Microsoft.UI.Colors.FromARGB(255, 248, 55, 88));
        }
        // Trả về màu xám hoặc màu DividerColor khi IsChecked = false
        return (SolidColorBrush)Application.Current.Resources["DividerColor"];
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}
