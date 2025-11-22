using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required, MaxLength(50)]
        [Column("username")]
        public string Username { get; set; } = null!;

        [Required, MaxLength(255)]
        [Column("password")]
        public string Password { get; set; } = null!;

        [Column("full_name")]
        [MaxLength(100)]
        public string? FullName { get; set; } = null!;

        [Column("role")]
        public string Role { get; set; } = "staff";

        [Column("status")]
        public string Status {get; set;} = "active";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("customer_id")]
        public int? CustomerId { get; set; }
    }
}
