using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class PaymentCreateForm
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [Required]
        [RegularExpression("cash|card|bank_transfer|e-wallet|momo|vnpay", ErrorMessage = "Invalid payment method")]
        public string PaymentMethod { get; set; } = "cash";
    }
}
