using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace be_retail.Models
{
    [Table("categories")]
    public class Category
    {
        [Key]
        [Column("category_id")]
        public int CategoryId { get; set; }

        [Required, MaxLength(100)]
        [Column("category_name")]
        public string Name { get; set; } = null!;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = true;
    }
}
