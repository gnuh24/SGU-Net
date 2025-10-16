using System;

namespace be_retail.DTOs.Inventory
{
    public class InventoryResponseDTO
    {
        public int InventoryId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Thông tin sản phẩm
        public string? ProductName { get; set; }
        public string? Barcode { get; set; }
        public decimal? Price { get; set; }
        public string? Unit { get; set; }

        // Thông tin Category
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        // Thông tin Supplier
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        // Cảnh báo tồn kho thấp
        public bool IsLowStock { get; set; } = false;
    }
}