using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class OrderItemCreateForm
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
