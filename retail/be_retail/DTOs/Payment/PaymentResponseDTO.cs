namespace be_retail.DTOs
{
    public class PaymentResponseDTO
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "cash";
        public DateTime? PaymentDate { get; set; }
        public long PaymentTranId { get; set; }
    }
}
