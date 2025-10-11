using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class PaymentUpdateForm
    {
        [Required]
        public int PaymentId { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        [RegularExpression("cash|card|bank_transfer|e-wallet")]
        public string PaymentMethod { get; set; }
    }
}
