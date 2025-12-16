namespace RetailMobile.Models;

public class CartItem
{
    [System.ComponentModel.DataAnnotations.Key]
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; } = null!;
    public string ImageUrl { get; set; } = null!;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal TotalPrice => Quantity * Price;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public bool IsSelected { get; set; } = false;
}
