import { apiService } from "./apiService";
import { mockReportService } from "./mock/mockReportService";

class ReportService {
  private get useMock() {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  async getRevenue(period: string = "month") {
    if (this.useMock) return mockReportService.getRevenue(period);
    const res = await apiService.get<any>(`/reports/revenue?period=${period}`);
    return res.data || [];
  }

  async getTopProducts() {
    if (this.useMock) return mockReportService.getTopProducts();
    const res = await apiService.get<any>(`/reports/top-products`);
    return res.data || [];
  }
}

export const reportService = new ReportService();
