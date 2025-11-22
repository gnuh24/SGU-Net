import { apiService } from "./apiService";
import { mockPromotionService } from "./mock/mockPromotionService";

class PromotionService {
  private get useMock() {
    return import.meta.env.VITE_USE_MOCK_API === "true";
  }

  // Helper to extract data from ApiResponse wrapper
  private unwrapResponse(response: any): any {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  }

  // Map backend field names to frontend format
  private mapPromotionToFrontend(promo: any): any {
    // Backend now returns camelCase after Program.cs config
    return {
      id: promo.promoId || promo.PromoId || promo.id,
      promo_code: promo.promoCode || promo.PromoCode || promo.promo_code,
      description: promo.description || promo.Description,
      discount_type:
        promo.discountType || promo.DiscountType || promo.discount_type,
      discount_value:
        promo.discountValue || promo.DiscountValue || promo.discount_value,
      start_date:
        promo.startDate ||
        promo.StartDate ||
        promo.start_date ||
        promo.start_at,
      end_date:
        promo.endDate || promo.EndDate || promo.end_date || promo.end_at,
      min_order_amount:
        promo.minOrderAmount || promo.MinOrderAmount || promo.min_order_amount,
      usage_limit: promo.usageLimit || promo.UsageLimit || promo.usage_limit,
      used_count: promo.usedCount || promo.UsedCount || promo.used_count,
      status: promo.status || promo.Status,
    };
  }

  // Map frontend format to backend format
  private mapPromotionToBackend(promo: any): any {
    return {
      promoCode: promo.promo_code || promo.promoCode,
      description: promo.description,
      discountType: promo.discount_type || promo.discountType,
      discountValue: promo.discount_value || promo.discountValue,
      startDate: promo.start_date || promo.start_at || promo.startDate,
      endDate: promo.end_date || promo.end_at || promo.endDate,
      minOrderAmount: promo.min_order_amount || promo.minOrderAmount || 0,
      usageLimit: promo.usage_limit || promo.usageLimit || 0,
      status: promo.status || "active",
    };
  }

  async getPromotions() {
    if (this.useMock) return mockPromotionService.getPromotions();
    const res = await apiService.get("/promotions");
    const data = this.unwrapResponse(res);
    const promotions = Array.isArray(data) ? data : data.items || [];
    return promotions.map(this.mapPromotionToFrontend);
  }

  async getPromotionById(id: number) {
    if (this.useMock) return mockPromotionService.getPromotionById(Number(id));
    const res = await apiService.get(`/promotions/${id}`);
    const data = this.unwrapResponse(res);
    return this.mapPromotionToFrontend(data);
  }

  async createPromotion(data: any) {
    if (this.useMock) return mockPromotionService.createPromotion(data);
    const backendData = this.mapPromotionToBackend(data);
    const res = await apiService.post("/promotions", backendData);
    const created = this.unwrapResponse(res);
    return this.mapPromotionToFrontend(created);
  }

  async updatePromotion(id: number, data: any) {
    if (this.useMock)
      return mockPromotionService.updatePromotion(Number(id), data);
    const backendData = this.mapPromotionToBackend(data);
    const res = await apiService.put(`/promotions/${id}`, backendData);
    const updated = this.unwrapResponse(res);
    return this.mapPromotionToFrontend(updated);
  }

  async deletePromotion(id: number) {
    if (this.useMock) return mockPromotionService.deletePromotion(Number(id));
    await apiService.delete(`/promotions/${id}`);
  }
}

export const promotionService = new PromotionService();
