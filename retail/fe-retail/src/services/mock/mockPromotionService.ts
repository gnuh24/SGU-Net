import { mockPromotions } from "./mockPromotions";

class MockPromotionService {
  async getPromotions(): Promise<any[]> {
    return mockPromotions;
  }

  async getPromotionById(id: number): Promise<any> {
    const p = mockPromotions.find((m) => m.id === Number(id));
    if (!p) throw new Error("Promotion not found");
    return p;
  }

  async createPromotion(data: any): Promise<any> {
    const newItem = {
      id: Math.max(...mockPromotions.map((p) => p.id)) + 1,
      ...data,
    };
    mockPromotions.push(newItem);
    return newItem;
  }

  async updatePromotion(id: number, data: any): Promise<any> {
    const idx = mockPromotions.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error("Promotion not found");
    mockPromotions[idx] = { ...mockPromotions[idx], ...data };
    return mockPromotions[idx];
  }

  async deletePromotion(id: number): Promise<void> {
    const idx = mockPromotions.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new Error("Promotion not found");
    mockPromotions.splice(idx, 1);
  }

  async validatePromotion(
    promoCode: string,
    orderAmount: number
  ): Promise<any> {
    const promo = mockPromotions.find(
      (p) => p.promo_code.toUpperCase() === promoCode.toUpperCase()
    );

    // Mã không tồn tại
    if (!promo) {
      return {
        valid: false,
        reason: "Mã khuyến mãi không tồn tại!",
      };
    }

    // Kiểm tra trạng thái
    if (promo.status === "inactive") {
      return {
        valid: false,
        reason: "Mã khuyến mãi không còn hoạt động!",
      };
    }

    // Kiểm tra hạn sử dụng
    const now = new Date();
    if (promo.start_at && new Date(promo.start_at) > now) {
      return {
        valid: false,
        reason: "Mã khuyến mãi chưa có hiệu lực!",
      };
    }

    if (promo.end_at && new Date(promo.end_at) < now) {
      return {
        valid: false,
        reason: "Mã khuyến mãi đã hết hạn!",
      };
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (promo.min_order_amount && orderAmount < promo.min_order_amount) {
      return {
        valid: false,
        reason: `Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString(
          "vi-VN"
        )}₫`,
      };
    }

    // Kiểm tra số lượt sử dụng (giả sử còn lượt)
    if (promo.usage_limit !== undefined && promo.usage_limit <= 0) {
      return {
        valid: false,
        reason: "Mã khuyến mãi đã hết lượt sử dụng!",
      };
    }

    // Mã hợp lệ
    return {
      valid: true,
      promotion: {
        promoId: promo.id,
        promoCode: promo.promo_code,
        discountType:
          promo.discount_type === "percent" ? "percentage" : "fixed_amount",
        discountValue: promo.discount_value,
      },
    };
  }
}

export const mockPromotionService = new MockPromotionService();
