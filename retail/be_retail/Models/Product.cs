using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("products")]
    public class Product
    {
        [Key]
        [Column("product_id")]
        public int ProductId { get; set; }

        [Column("category_id")]
        public int? CategoryId { get; set; }

        [Column("supplier_id")]
        public int? SupplierId { get; set; }

        [Required, MaxLength(100)]
        [Column("product_name")]
        public string Name { get; set; } = null!;

        [MaxLength(50)]
        [Column("barcode")]
        public string? Barcode { get; set; }

        [MaxLength(255)]
        [Column("image")]
        public string? Image { get; set; }

        [Column("price", TypeName = "DECIMAL(10,2)")]
        public decimal Price { get; set; }

        [MaxLength(20)]
        [Column("unit")]
        public string Unit { get; set; } = "pcs";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;
        
        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier? Supplier { get; set; }
    }
}
