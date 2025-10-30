using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class InventoryCreateForm
    {
        [Required]
        public int ProductId { get; set; }

        [Required, Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
