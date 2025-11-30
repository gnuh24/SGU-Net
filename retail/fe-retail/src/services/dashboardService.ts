import { apiService } from "./apiService";

// Separate axios for statistics API
import axios from "axios";

const statsApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL?.replace("/v1", "") ||
    "http://localhost:5260/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to statistics API
statsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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

interface RecentOrder {
  id: number;
  customer: string;
  amount: number;
  time: string;
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

      // Get low stock products count
      const lowStockRes = await apiService.get("/products/low-stock");
      const lowStockData = this.unwrapResponse(lowStockRes);
      const lowStockCount = Array.isArray(lowStockData)
        ? lowStockData.length
        : lowStockData?.items?.length || 0;

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

  /**
   * Get recent orders (today)
   */
  async getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
    try {
      const now = new Date();
      const today = now.toLocaleDateString("en-CA");

      const response = await apiService.get("/orders", {
        params: {
          fromDate: today, // Backend uses fromDate/toDate not startDate/endDate
          toDate: today,
          pageSize: limit,
          page: 1,
        },
      });

      const data = this.unwrapResponse(response);
      const orders = Array.isArray(data)
        ? data
        : data?.items || data?.data || [];

      return orders.map((order: any) => {
        // Backend returns orderDate field
        const orderDate = new Date(
          order.orderDate ||
          order.order_date ||
          order.createdAt ||
          order.created_at
        );
        const timeStr = !isNaN(orderDate.getTime())
          ? orderDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "N/A";

        return {
          id: order.orderId || order.order_id || order.id,
          customer:
            order.customerName || order.customer_name || "Khách vãng lai",
          amount:
            (order.totalAmount || order.total_amount || 0) -
            (order.discountAmount || order.discount_amount || 0),
          time: timeStr,
        };
      });
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
        params: { limit },
      });

      const data = this.unwrapResponse(response);
      const items = Array.isArray(data) ? data : data?.items || [];

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
