using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class OrderUpdateForm
    {
        [Required]
        public int OrderId { get; set; }
        public int? UserId { get; set; }
        public int? PromoId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? TotalAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DiscountAmount { get; set; }

        public string? Status { get; set; }
    }
}