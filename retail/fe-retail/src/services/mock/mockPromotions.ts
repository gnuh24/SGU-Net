export type MockPromotion = {
  id: number;
  promo_code: string;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  start_at?: string;
  end_at?: string;
  min_order_amount?: number;
  usage_limit?: number;
  status?: "active" | "inactive";
};

let promotions: MockPromotion[] = [
  {
    id: 1,
    promo_code: "WELCOME10",
    description: "Giảm 10% cho khách hàng mới",
    discount_type: "percent",
    discount_value: 10,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    min_order_amount: 0,
    usage_limit: 1000,
    status: "active",
  },
  {
    id: 2,
    promo_code: "FLAT50",
    description: "Giảm 50k cho đơn hàng trên 500k",
    discount_type: "fixed",
    discount_value: 50000,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    min_order_amount: 500000,
    usage_limit: 500,
    status: "active",
  },
];

export const mockPromotions = promotions;

export const resetMockPromotions = () => {
  promotions = [...mockPromotions];
};
