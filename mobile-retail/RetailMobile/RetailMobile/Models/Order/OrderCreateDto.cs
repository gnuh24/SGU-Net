using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RetailMobile.Models.Order;

public class OrderCreateDto
{
    public int CustomerId { get; set; }
    public int? UserId { get; set; }
    public int? PromoId { get; set; }
    public string Status { get; set; } = "pending";
    public string PaymentMethod { get; set; } = "cash";
    public List<OrderItemCreateDto> OrderItems { get; set; } = new();
}
