namespace be_retail.DTOs
{
    public class SupplierResponseDTO
    {
        public int SupplierId { get; set; }
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
    }
}
