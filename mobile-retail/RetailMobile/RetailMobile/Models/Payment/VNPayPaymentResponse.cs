using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RetailMobile.Models.Payment;

public class VNPayPaymentResponse
{
    public string PaymentUrl { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
}
