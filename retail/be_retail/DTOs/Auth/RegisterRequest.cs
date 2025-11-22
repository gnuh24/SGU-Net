using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class RegisterRequest
    {
        [Required, MaxLength(50)]
        public string Username { get; set; } = null!;

        [Required, MaxLength(255)]
        public string Password { get; set; } = null!;

        [Required, MaxLength(100)]
        public string FullName { get; set; } = null!;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = null!; // thêm phone
    }
}