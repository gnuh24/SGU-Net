using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("promotions")]
    public class Promotion
    {
        [Key]
        [Column("promo_id")]
        public int PromoId { get; set; }

        [Required, MaxLength(50)]
        [Column("promo_code")]
        public string PromoCode { get; set; } = null!;

        [MaxLength(255)]
        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("discount_type")]
        public string DiscountType { get; set; } = null!;

        [Required]
        [Column("discount_value", TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; }

        [Required]
        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("min_order_amount", TypeName = "decimal(10,2)")]
        public decimal MinOrderAmount { get; set; } = 0;

        [Column("usage_limit")]
        public int UsageLimit { get; set; } = 0;

        [Column("used_count")]
        public int UsedCount { get; set; } = 0;

        [Column("status")]
        public string Status { get; set; } = "active";
    }
}
