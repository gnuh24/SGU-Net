using System;

namespace be_retail.DTOs.Inventory
{
    public class InventoryResponseDTO
    {
        public int InventoryId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}