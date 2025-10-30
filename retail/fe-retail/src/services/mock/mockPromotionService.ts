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
}

export const mockPromotionService = new MockPromotionService();
