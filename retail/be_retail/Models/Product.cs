<<<<<<< HEAD
using System;
=======
>>>>>>> origin/main
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

<<<<<<< HEAD
        [Required, MaxLength(100)]
        [Column("product_name")]
        public string ProductName { get; set; } = null!;

        [MaxLength(13)]
        [Column("barcode")]
        public string? Barcode { get; set; }

=======
>>>>>>> origin/main
        [Column("category_id")]
        public int? CategoryId { get; set; }

        [Column("supplier_id")]
        public int? SupplierId { get; set; }

<<<<<<< HEAD
        [MaxLength(100)]
        [Column("price")]
        public decimal Price { get; set; }

        [Column("unit")]
        public string? Unit { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Column("is_deleted")]
        public string IsDeleted { get; set; } = "0";
    }

    [Table("categories")]
    public class Category
    {
        [Key]
        [Column("category_id")]
        public int CategoryId { get; set; }
    }

    [Table("suppliers")]
    public class Supplier
    {
        [Key]
        [Column("supplier_id")]
        public int SupplierId { get; set; }
=======
        [Required, MaxLength(100)]
        [Column("product_name")]
        public string Name { get; set; } = null!;

        [MaxLength(50)]
        [Column("barcode")]
        public string? Barcode { get; set; }

        [Column("price", TypeName = "DECIMAL(10,2)")]
        public decimal Price { get; set; }

        [MaxLength(20)]
        [Column("unit")]
        public string Unit { get; set; } = "pcs";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier? Supplier { get; set; }
>>>>>>> origin/main
    }
}
