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
  {
    id: 3,
    promo_code: "EXPIRED2024",
    description: "Khuyến mãi đã hết hạn (để test)",
    discount_type: "percent",
    discount_value: 20,
    start_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 ngày trước
    end_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 ngày trước
    min_order_amount: 0,
    usage_limit: 100,
    status: "active",
  },
  {
    id: 4,
    promo_code: "INACTIVE99",
    description: "Khuyến mãi đã tắt (để test)",
    discount_type: "fixed",
    discount_value: 99000,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    min_order_amount: 0,
    usage_limit: 100,
    status: "inactive",
  },
  {
    id: 5,
    promo_code: "FUTURE50",
    description: "Khuyến mãi tương lai (để test)",
    discount_type: "percent",
    discount_value: 50,
    start_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 ngày sau
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    min_order_amount: 0,
    usage_limit: 50,
    status: "active",
  },
];

// Backup ban đầu để reset
const initialPromotions: MockPromotion[] = [
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
  {
    id: 3,
    promo_code: "EXPIRED2024",
    description: "Khuyến mãi đã hết hạn (để test)",
    discount_type: "percent",
    discount_value: 20,
    start_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    end_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    min_order_amount: 0,
    usage_limit: 100,
    status: "active",
  },
  {
    id: 4,
    promo_code: "INACTIVE99",
    description: "Khuyến mãi đã tắt (để test)",
    discount_type: "fixed",
    discount_value: 99000,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    min_order_amount: 0,
    usage_limit: 100,
    status: "inactive",
  },
  {
    id: 5,
    promo_code: "FUTURE50",
    description: "Khuyến mãi tương lai (để test)",
    discount_type: "percent",
    discount_value: 50,
    start_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    min_order_amount: 0,
    usage_limit: 50,
    status: "active",
  },
];

export const mockPromotions = promotions;

export const resetMockPromotions = () => {
  promotions.length = 0;
  promotions.push(...initialPromotions);
};
