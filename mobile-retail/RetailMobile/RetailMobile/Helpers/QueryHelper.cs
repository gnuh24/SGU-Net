using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Helpers;

public static class QueryHelper
{
    public static Dictionary<string, string> ToQueryParams(Object obj)
    {
        if (obj == null) return new Dictionary<string, string>();
        var dict = new Dictionary<string, string>();

        foreach (PropertyInfo props in obj.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            var value =  props.GetValue(obj);
            if (value != null)
            {
                dict[props.Name] = value.ToString();
            }    
            
        }

        return dict; 
    }

    public static Dictionary<string, string> ToQueryParams(params (string Key, object? Value)[] items)
    {
        return items
            .Where(x => x.Value != null)
            .ToDictionary(x => x.Key, x => x.Value!.ToString()!);
    }
}
