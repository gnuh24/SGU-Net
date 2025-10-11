using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class OrderItemUpdateForm
    {
        [Required]
        public int OrderItemId { get; set; }

        [Range(1, int.MaxValue)]
        public int? Quantity { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Subtotal { get; set; }
    }
}
