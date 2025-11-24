namespace be_retail.DTOs
{
    public class VNPayPaymentRequest
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string? ReturnUrl { get; set; }
        public string? OrderInfo { get; set; }
    }
}

