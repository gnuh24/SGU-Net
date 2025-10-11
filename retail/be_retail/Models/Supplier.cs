using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("suppliers")]
    public class Supplier
    {
        [Key]
        [Column("supplier_id")]
        public int SupplierId { get; set; }

        [Required, MaxLength(100)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [MaxLength(20)]
        [Column("phone")]
        public string? Phone { get; set; }

        [MaxLength(100)]
        [Column("email")]
        public string? Email { get; set; }

        [Column("address", TypeName = "TEXT")]
        public string? Address { get; set; }

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = true;

    }
}
