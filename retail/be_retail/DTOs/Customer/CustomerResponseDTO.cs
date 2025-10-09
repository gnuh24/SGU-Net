using System;

namespace be_retail.DTOs
{
    public class CustomerResponseDTO
    {
        public int CustomerId { get; set; }

        public string Name { get; set; } = null!;

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
