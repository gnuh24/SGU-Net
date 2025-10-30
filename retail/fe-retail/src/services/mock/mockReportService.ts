import { mockRevenue, mockTopProducts } from "./mockReports";

class MockReportService {
  async getRevenue(period: string = "month") {
    return mockRevenue;
  }

  async getTopProducts() {
    return mockTopProducts;
  }
}

export const mockReportService = new MockReportService();
