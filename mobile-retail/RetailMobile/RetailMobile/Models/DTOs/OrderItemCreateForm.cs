namespace RetailMobile.Models.DTOs;

/// <summary>
/// DTO for creating an order item
/// </summary>
public class OrderItemCreateForm
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
