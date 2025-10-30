namespace be_retail.DTOs.Promotion
{
    public class ValidatePromotionResponse
    {
        public bool Valid { get; set; }
        public string? Reason { get; set; }
        public PromotionInfo? Promotion { get; set; }
    }

    public class PromotionInfo
    {
        public int PromoId { get; set; }
        public string PromoCode { get; set; } = null!;
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
    }
}
