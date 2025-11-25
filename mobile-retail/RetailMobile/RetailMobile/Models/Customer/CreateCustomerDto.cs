using System.ComponentModel.DataAnnotations;

namespace RetailMobile.Models;

public class CustomerCreateForm
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    public string Phone { get; set; } = null!;

    [MaxLength(100)]
    public string? Email { get; set; }

    public string Address { get; set; } = null!;
}
