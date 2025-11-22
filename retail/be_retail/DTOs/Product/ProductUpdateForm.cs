using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class ProductUpdateForm
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(13, MinimumLength = 13, ErrorMessage = "Barcode phải có đúng 13 ký tự.")]
        [RegularExpression("^890\\d{10}$", ErrorMessage = "Barcode phải có dạng 890XXXXXXXXXX (13 chữ số).")]
        public string? Barcode { get; set; }

        [MaxLength(255)]
        public string? Image { get; set; }

        [Required, Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public string? Unit { get; set; }

        public int? CategoryId { get; set; }

        public int? SupplierId { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}
