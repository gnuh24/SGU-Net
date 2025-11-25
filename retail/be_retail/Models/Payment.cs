using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("payment_id")]
        public int PaymentId { get; set; }

        [Column("order_id")]
        public int OrderId { get; set; }

        [Column("amount", TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Column("payment_method")]
        [Required]
        public string PaymentMethod { get; set; } = "cash"; // 'cash','card','bank_transfer','e-wallet','momo','vnpay'

        [Column("payment_date")]
        public DateTime? PaymentDate { get; set; }

        // 🔗 Navigation property
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }
    }
}
