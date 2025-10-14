using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs.Inventory
{
    public class InventoryUpdateForm
    {
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng phải >= 0")]
        public int Quantity { get; set; }
    }
}


