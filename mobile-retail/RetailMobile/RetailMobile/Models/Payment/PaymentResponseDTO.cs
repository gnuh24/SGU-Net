using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models.Payment;

public class PaymentResponseDTO
{
    public int PaymentId { get; set; }
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "cash";
    public DateTime? PaymentDate { get; set; }
    public long PaymentTranId { get; set; }
}
