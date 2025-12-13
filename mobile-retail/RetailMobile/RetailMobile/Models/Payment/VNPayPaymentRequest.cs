using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models.Payment;

public class VNPayPaymentRequest
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? ReturnUrl { get; set; }
    public string? OrderInfo { get; set; }
}
