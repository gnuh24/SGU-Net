import { apiService } from "./apiService";

// Separate axios for statistics API
import axios from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../constants";

const statsApi = axios.create({
  baseURL: API_BASE_URL.replace(/\/v1$/, ""),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to statistics API
statsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  totalCustomers: number;
  lowStockProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

interface LowStockProduct {
  productId: number;
  name: string;
  stock: number;
  threshold: number;
}

class DashboardService {
  private unwrapResponse(response: any): any {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(): Promise<DashboardStats> {
    try {
      // Use current date in YYYY-MM-DD format (local timezone)
      const now = new Date();
      const today = now.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD
      const yesterday = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-CA");

      // Get today's data
      const todayRes = await statsApi.get(
        `/statistics/overview?startDate=${today}&endDate=${today}`
      );
      const todayData = this.unwrapResponse(todayRes);

      // Get yesterday's data for comparison
      const yesterdayRes = await statsApi.get(
        `/statistics/overview?startDate=${yesterday}&endDate=${yesterday}`
      );
      const yesterdayData = this.unwrapResponse(yesterdayRes);

      // Get low stock products count (threshold=20)
      const lowStockRes = await apiService.get("/products/low-stock", {
        params: { threshold: 20, page: 1, pageSize: 100 },
      });
      const lowStockData = this.unwrapResponse(lowStockRes);
      const lowStockItems = Array.isArray(lowStockData)
        ? lowStockData
        : lowStockData.data || lowStockData.items || [];
      const lowStockCount = lowStockItems.length;

      // Calculate growth percentages
      const revenueGrowth =
        yesterdayData.totalRevenue > 0
          ? ((todayData.totalRevenue - yesterdayData.totalRevenue) /
            yesterdayData.totalRevenue) *
          100
          : 0;

      const ordersGrowth =
        yesterdayData.totalOrders > 0
          ? ((todayData.totalOrders - yesterdayData.totalOrders) /
            yesterdayData.totalOrders) *
          100
          : 0;

      const customersGrowth =
        yesterdayData.totalCustomers > 0
          ? ((todayData.totalCustomers - yesterdayData.totalCustomers) /
            yesterdayData.totalCustomers) *
          100
          : 0;

      return {
        todayRevenue: todayData.totalRevenue || 0,
        todayOrders: todayData.totalOrders || 0,
        totalCustomers: todayData.totalCustomers || 0, // ✅ FIX: Lấy từ API statistics
        lowStockProducts: lowStockCount,
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        ordersGrowth: Number(ordersGrowth.toFixed(1)),
        customersGrowth: Number(customersGrowth.toFixed(1)),
      };
    } catch (error) {
      // Return default values on error
      return {
        todayRevenue: 0,
        todayOrders: 0,
        totalCustomers: 0,
        lowStockProducts: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0,
      };
    }
  }

  // (Giữ lại getRecentOrders nếu cần dùng ở nơi khác)

  /**
   * Get top selling products today
   */
  async getTopSellingProductsToday(
    limit: number = 5
  ): Promise<
    {
      productId: number;
      productName: string;
      totalQuantitySold: number;
      totalRevenue: number;
    }[]
  > {
    try {
      const now = new Date();
      const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD

      const res = await statsApi.get(
        `/statistics/products?startDate=${today}&endDate=${today}&top=${limit}`
      );

      const data = this.unwrapResponse(res);
      const items = Array.isArray(data)
        ? data
        : data.Data || data.data || data.items || [];

      return items.map((item: any) => ({
        productId: item.productId || item.ProductId,
        productName: item.productName || item.ProductName || "N/A",
        totalQuantitySold:
          item.totalQuantitySold || item.TotalQuantitySold || 0,
        totalRevenue:
          item.totalRevenue || item.TotalRevenue || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(limit: number = 5): Promise<LowStockProduct[]> {
    try {
      const response = await apiService.get("/products/low-stock", {
        // Đúng API: ?threshold=20
        params: { threshold: 20, page: 1, pageSize: limit },
      });

      const data = this.unwrapResponse(response);
      const items = Array.isArray(data)
        ? data
        : data.data || data.items || [];

      return items.slice(0, limit).map((item: any) => ({
        productId: item.productId || item.product_id || item.id,
        name: item.productName || item.product_name || item.name || "N/A",
        stock: item.currentStock || item.current_stock || item.quantity || 0,
        threshold: item.minStock || item.min_stock || item.threshold || 20,
      }));
    } catch (error) {
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
