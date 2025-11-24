using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace be_retail.DTOs
{
    public class PaymentUpdateForm
    {
        [Required]
        public int PaymentId { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [RegularExpression("cash|card|bank_transfer|e-wallet|momo|vnpay")]
        public string PaymentMethod { get; set; } = null!;
    }
}
