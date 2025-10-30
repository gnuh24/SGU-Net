import { apiService } from "./apiService";
import { mockPromotionService } from "./mock/mockPromotionService";

class PromotionService {
  private get useMock() {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  async getPromotions() {
    if (this.useMock) return mockPromotionService.getPromotions();
    const res = await apiService.get<any[]>("/promotions");
    return res.data || [];
  }

  async getPromotionById(id: number) {
    if (this.useMock) return mockPromotionService.getPromotionById(Number(id));
    const res = await apiService.get<any>(`/promotions/${id}`);
    return res.data;
  }

  async createPromotion(data: any) {
    if (this.useMock) return mockPromotionService.createPromotion(data);
    const res = await apiService.post<any>(`/promotions`, data);
    return res.data;
  }

  async updatePromotion(id: number, data: any) {
    if (this.useMock)
      return mockPromotionService.updatePromotion(Number(id), data);
    const res = await apiService.put<any>(`/promotions/${id}`, data);
    return res.data;
  }

  async deletePromotion(id: number) {
    if (this.useMock) return mockPromotionService.deletePromotion(Number(id));
    await apiService.delete(`/promotions/${id}`);
  }
}

export const promotionService = new PromotionService();
