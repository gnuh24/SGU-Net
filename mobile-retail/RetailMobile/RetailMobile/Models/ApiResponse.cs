using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Refit;

namespace RetailMobile.Models;

public class ApiResponse<T>
{
    public int Status { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
}
