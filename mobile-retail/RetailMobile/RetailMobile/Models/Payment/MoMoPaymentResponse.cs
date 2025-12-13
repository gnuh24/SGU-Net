using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RetailMobile.Models.Payment;

public class MoMoPaymentResponse
{
    public int ResultCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string PayUrl { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string? Deeplink { get; set; }
    public string? OrderId { get; set; }
}
