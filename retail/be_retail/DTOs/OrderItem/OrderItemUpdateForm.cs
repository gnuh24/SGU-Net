using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs
{
    public class OrderItemUpdateForm
    {
        public int? OrderItemId { get; set; }

        public int ProductId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
