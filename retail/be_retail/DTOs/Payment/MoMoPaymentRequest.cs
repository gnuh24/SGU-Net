using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class MoMoPaymentRequest
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public string? ReturnUrl { get; set; }
        public string? NotifyUrl { get; set; }
    }
}

