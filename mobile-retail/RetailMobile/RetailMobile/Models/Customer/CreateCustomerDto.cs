namespace RetailMobile.Models;

public class CustomerCreateForm
{
    public string Name { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public string? Email { get; set; }

    public string Address { get; set; } = null!;
}
