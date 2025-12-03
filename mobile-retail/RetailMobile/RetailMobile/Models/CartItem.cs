using SQLite;

namespace RetailMobile.Models;

public class CartItem
{
    [PrimaryKey]
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }

    public decimal TotalPrice => Quantity * Price;
}
