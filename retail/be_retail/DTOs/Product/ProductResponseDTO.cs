using System;

namespace be_retail.DTOs
{
    public class ProductResponseDTO
    {
        public int ProductId { get; set; }

        public int? CategoryId { get; set; }

        public int? SupplierId { get; set; }

        public string ProductName { get; set; } = null!;

        public string? Barcode { get; set; }

        public decimal Price { get; set; }

        public string? Unit { get; set; }

        public DateTime CreatedAt { get; set; }

        public string IsDeleted { get; set; } = "0";
    }
}
