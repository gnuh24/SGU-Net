import axios from "axios";
import { mockReportService } from "./mock/mockReportService";
import { API_BASE_URL } from "../constants";

// Create separate axios instance for statistics API (different base path)
const statsApi = axios.create({
  baseURL: API_BASE_URL.replace(/\/v1$/, ""),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

class ReportService {
  private get useMock() {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  private unwrapResponse(response: any): any {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  }

  /**
   * Get overview statistics (revenue, orders, customers)
   * Backend: GET /api/statistics/overview?startDate=...&endDate=...
   */
  async getOverview(startDate?: string, endDate?: string) {
    if (this.useMock) {
      // Mock doesn't have this, return dummy data
      return {
        totalRevenue: 15000000,
        totalOrders: 245,
        totalCustomers: 89,
        averageOrderValue: 61224,
      };
    }

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await statsApi.get(`/statistics/overview?${params.toString()}`);
    return this.unwrapResponse(res);
  }

  /**
   * Get revenue data (legacy support)
   */
  async getRevenue(period: string = "month") {
    if (this.useMock) return mockReportService.getRevenue(period);

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;

    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString().split("T")[0];
    } else if (period === "year") {
      startDate = `${now.getFullYear()}-01-01`;
    } else {
      // month
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-01`;
    }

    const endDate = now.toISOString().split("T")[0];
    const overview = await this.getOverview(startDate, endDate);

    // Format as array for compatibility
    return [{ date: startDate, revenue: overview.totalRevenue || 0 }];
  }

  /**
   * Get top selling products
   * Backend: GET /api/statistics/products?top=10
   */
  async getTopProducts(top: number = 10) {
    if (this.useMock) return mockReportService.getTopProducts();

    const res = await statsApi.get(`/statistics/products?top=${top}`);
    const data = this.unwrapResponse(res);

    // Backend returns paginated data with items array
    return Array.isArray(data) ? data : data.items || [];
  }

  /**
   * Get product statistics with filters
   * Backend: GET /api/statistics/products?startDate=...&endDate=...&categoryId=...&page=...&pageSize=...
   */
  async getProductStatistics(
    params: {
      startDate?: string;
      endDate?: string;
      categoryId?: number;
      top?: number;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    if (this.useMock) return mockReportService.getTopProducts();

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.categoryId)
      queryParams.append("categoryId", String(params.categoryId));
    if (params.top) queryParams.append("top", String(params.top));
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize)
      queryParams.append("pageSize", String(params.pageSize));

    const res = await statsApi.get(
      `/statistics/products?${queryParams.toString()}`
    );
    return this.unwrapResponse(res);
  }

  /**
   * Get customer statistics
   * Backend: GET /api/statistics/customers?startDate=...&endDate=...&page=...&pageSize=...
   */
  async getCustomerStatistics(
    params: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    if (this.useMock) {
      // Mock doesn't have this
      return {
        items: [],
        total: 0,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize)
      queryParams.append("pageSize", String(params.pageSize));

    const res = await statsApi.get(
      `/statistics/customers?${queryParams.toString()}`
    );
    return this.unwrapResponse(res);
  }
}

export const reportService = new ReportService();
