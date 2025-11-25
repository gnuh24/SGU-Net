namespace be_retail.DTOs
{
    public class MoMoPaymentResponse
    {
        public int ResultCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string PayUrl { get; set; } = string.Empty;
        public string? QrCodeUrl { get; set; }
        public string? Deeplink { get; set; }
        public string? OrderId { get; set; }
    }
}

