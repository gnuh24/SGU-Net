namespace be_retail.DTOs.Promotion
{
    public class PromotionResponseDTO
    {
        public int PromoId { get; set; }
        public string PromoCode { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MinOrderAmount { get; set; }
        public int UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public string Status { get; set; } = null!;
    }
}
