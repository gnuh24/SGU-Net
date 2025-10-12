using System.ComponentModel.DataAnnotations;
using be_retail.Models;

namespace be_retail.DTOs
{
    public class OrderCreateForm
    {
        public int CustomerId { get; set; }
        public int? UserId { get; set; }
        public int? PromoId { get; set; }
        public string Status { get; set; } = "pending";
        public string PaymentMethod { get; set; } = "cash";
        public List<OrderItemCreateForm> OrderItems { get; set; } = new();
    }
}