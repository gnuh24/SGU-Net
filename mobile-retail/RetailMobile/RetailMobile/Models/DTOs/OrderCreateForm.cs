namespace RetailMobile.Models.DTOs;

/// <summary>
/// DTO for creating an order
/// </summary>
public class OrderCreateForm
{
    public int CustomerId { get; set; }
    public int? UserId { get; set; }
    public int? PromoId { get; set; }
    public string Status { get; set; } = "pending";
    public string PaymentMethod { get; set; } = "cash";
    public List<OrderItemCreateForm> OrderItems { get; set; } = new();
}
