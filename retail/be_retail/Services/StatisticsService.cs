using be_retail.Repositories;
using System;
using System.Threading.Tasks;

namespace be_retail.Services
{
    public class StatisticsService
    {
        private readonly StatisticsRepository _repository;

        public StatisticsService(StatisticsRepository repository)
        {
            _repository = repository;
        }

        public async Task<object> GetStatisticsAsync(DateTime? startDate, DateTime? endDate)
        {
            if (endDate.HasValue && startDate.HasValue && endDate < startDate)
                throw new ArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");

            return await _repository.GetStatisticsAsync(startDate, endDate);
        }

        public async Task<object> GetProductStatisticsAsync(
            DateTime? startDate,
            DateTime? endDate,
            int? categoryId,
            int? top,
            int page,
            int pageSize)
        {
            if (endDate.HasValue && startDate.HasValue && endDate < startDate)
                throw new ArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");

            return await _repository.GetProductStatisticsAsync(startDate, endDate, categoryId, top, page, pageSize);
        }

        public async Task<object> GetCustomerStatisticsAsync(
            DateTime? startDate, 
            DateTime? endDate, 
            int page, 
            int pageSize)
        {
            // Trong tương lai, bạn có thể thêm logic nghiệp vụ,
            // validation, hoặc mapping DTO ở đây.
            // Hiện tại, chúng ta chỉ gọi qua repository.
            try
            {
                return await _repository.GetCustomerStatisticsAsync(
                    startDate, 
                    endDate, 
                    page, 
                    pageSize);
            }
            catch (Exception ex)
            {
                // Xử lý hoặc log lỗi ở tầng service
                throw new Exception("Lỗi nghiệp vụ khi lấy thống kê khách hàng.", ex);
            }
        }

    }
}
