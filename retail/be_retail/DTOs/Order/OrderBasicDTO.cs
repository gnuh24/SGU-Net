namespace be_retail.DTOs
{
    public class OrderBasicDTO
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int? UserId { get; set; }
        public int? PromoId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        
        // Navigation properties
        public string? CustomerName { get; set; }
        public string? UserName { get; set; }
        public string? PromoName { get; set; }
    }
}