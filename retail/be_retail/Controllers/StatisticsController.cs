using be_retail.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace be_retail.Controllers
{
    [ApiController]
    [Route("api/statistics")] // 👈 Route cố định, không dùng [controller]
    public class StatisticsController : ControllerBase
    {
        private readonly StatisticsService _service;

        public StatisticsController(StatisticsService service)
        {
            _service = service;
        }

        /// <summary>
        /// API: /api/statistics/overview
        /// Thống kê tổng quan (doanh thu, đơn hàng, khách hàng)
        /// </summary>
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverviewStatistics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            // Nếu không truyền thì mặc định lấy tháng hiện tại
            if (!startDate.HasValue || !endDate.HasValue)
            {
                var now = DateTime.Now;
                startDate ??= new DateTime(now.Year, now.Month, 1); // ngày đầu tháng
                endDate ??= startDate.Value.AddMonths(1).AddDays(-1); // ngày cuối tháng
            }

            var result = await _service.GetStatisticsAsync(startDate, endDate);
            return Ok(result);
        }

        /// <summary>
        /// API: /api/statistics/products
        /// Thống kê bán hàng theo sản phẩm (lọc theo tháng, loại sản phẩm, top, hoặc phân trang)
        /// </summary>
        [HttpGet("products")]
        public async Task<IActionResult> GetProductStatistics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? categoryId,
            [FromQuery] int? top,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _service.GetProductStatisticsAsync(startDate, endDate, categoryId, top, page, pageSize);
            return Ok(result);
        }


        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomerStatistics(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // SỬA: Gọi qua service
                var result = await _service.GetCustomerStatisticsAsync(
                    startDate, 
                    endDate, 
                    page, 
                    pageSize);
                    
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Lỗi bây giờ sẽ được bắt từ tầng Service
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
