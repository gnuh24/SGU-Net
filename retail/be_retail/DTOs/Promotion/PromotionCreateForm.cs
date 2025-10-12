using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs.Promotion
{
    public class PromotionCreateForm
    {
        [Required, MaxLength(50)]
        public string PromoCode { get; set; } = null!;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required]
        public string DiscountType { get; set; } = null!;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Discount value must be greater than 0")]
        public decimal DiscountValue { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Minimum order amount must be 0 or greater")]
        public decimal MinOrderAmount { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Usage limit must be 0 or greater")]
        public int UsageLimit { get; set; } = 0;

        [Required]
        public string Status { get; set; } = "active"; 
    }
}
