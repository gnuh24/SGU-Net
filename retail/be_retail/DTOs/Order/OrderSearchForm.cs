namespace be_retail.DTOs
{
    public class OrderSearchForm
    {
        public int? CustomerId { get; set; }
        public int? UserId { get; set; }
        public int? PromoId { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        // Phân trang
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Sắp xếp
        public string? SortBy { get; set; } = "order_date";
        public string? SortDirection { get; set; } = "desc";
    }
}