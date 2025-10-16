using System.ComponentModel.DataAnnotations;

namespace be_retail.DTOs.Inventory
{
    public class StockInForm
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng nhập phải lớn hơn 0")]
        public int Quantity { get; set; }


    }
}