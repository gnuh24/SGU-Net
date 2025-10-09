using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class CustomerUpdateForm
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        public string? Address { get; set; }
    }
}
