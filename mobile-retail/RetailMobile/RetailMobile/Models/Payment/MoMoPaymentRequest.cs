using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models.Payment;

public class MoMoPaymentRequest
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? ReturnUrl { get; set; }
    public string? NotifyUrl { get; set; }
}
