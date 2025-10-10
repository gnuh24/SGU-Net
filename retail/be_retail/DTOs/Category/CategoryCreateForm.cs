using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class CategoryCreateForm
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;
    }
}
