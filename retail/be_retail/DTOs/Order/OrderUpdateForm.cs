namespace be_retail.DTOs
{
    public class OrderUpdateForm
    {
        public int? UserId { get; set; }
        public int? PromoId { get; set; }
        public string? Status { get; set; }
        public string? PaymentMethod { get; set; }

        public List<OrderItemUpdateForm>? OrderItems { get; set; }
    }
}