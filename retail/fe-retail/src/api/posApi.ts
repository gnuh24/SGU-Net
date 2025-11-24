import axios from "axios";
import { mockPromotionService } from "@/services/mock/mockPromotionService";

export interface SwaggerProduct {
  productId: number;
  productName: string;
  barcode: string;
  price: number;
  currentStock?: number;
  inventory?: { quantity?: number };
  image?: string;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  unit?: string;
}
export interface Customer {
  customerId: number;
  customerName: string;
  phoneNumber: string;
  id?: number;
  name?: string;
  phone?: string;
}
export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  stock: number;
}
export interface Promotion {
  promoId: number;
  promoCode: string;
  discountType: "percentage" | "percent" | "fixed_amount" | "fixed";
  discountValue: number;
}
export interface ValidatedPromoResponse {
  valid: boolean;
  promotion?: Promotion;
  reason?: string;
  promo?: Promotion;
}
export interface Order {
  orderId: number;
  id: number;
  createdAt: string;
  totalAmount?: number;
  discountAmount?: number;
  status?: string;
}

const API_BASE_URL = "http://localhost:5260/api/v1";
const apiClient = axios.create({ baseURL: API_BASE_URL });

const unwrapData = (response: any): any[] => {
  let data = response.data?.data?.data;
  if (data === undefined) {
    data = response.data?.data;
  }
  if (data === undefined) {
    data = response.data;
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "Phản hồi API không chứa dữ liệu mảng mong đợi sau khi giải nén."
    );
  }
  return data;
};

const unwrapSingleData = (response: any): any => {
  let data = response.data?.data;
  if (data === undefined) {
    data = response.data;
  }

  if (data === null || data === undefined) {
    throw new Error(
      "Phản hồi API không chứa đối tượng dữ liệu đơn lẻ mong đợi sau khi giải nén."
    );
  }
  return data;
};

export const posApi = {
  scanBarcode: (barcode: string): Promise<SwaggerProduct> =>
    apiClient.get(`/products/barcode/${barcode}`).then((response) => {
      const dataArray = unwrapSingleData(response);
      if (Array.isArray(dataArray) && dataArray.length > 0) {
        return dataArray[0]; // Chỉ trả về object sản phẩm đầu tiên
      }
      throw new Error("API scanBarcode không trả về dữ liệu sản phẩm hợp lệ.");
    }),

  getAllProducts: (): Promise<SwaggerProduct[]> =>
    apiClient.get(`/products?pageSize=1000`).then(unwrapData),

  getCustomers: (): Promise<Customer[]> =>
    apiClient.get(`/customers`).then(unwrapData),

  validatePromotion: async (
    promoCode: string,
    orderAmount: number
  ): Promise<ValidatedPromoResponse> => {
    // Kiểm tra mock mode
    const useMock = import.meta.env.VITE_USE_MOCK_API === "true";

    if (useMock) {
      // Sử dụng mock service
      return await mockPromotionService.validatePromotion(
        promoCode,
        orderAmount
      );
    }

    // Gọi API thực - backend uses PromoCode and OrderAmount (PascalCase)
    try {
      const response = await apiClient.post(`/promotions/validate`, {
        PromoCode: promoCode,
        OrderAmount: orderAmount,
      });

      // Backend returns: { status: 200, message: "...", data: { valid, reason, promotion } }
      const apiData = response.data?.data || response.data;

      // Support both PascalCase (old) and camelCase (new with Program.cs config)
      const promo = apiData.promotion || apiData.Promotion;

      return {
        valid: apiData.valid || apiData.Valid,
        reason: apiData.reason || apiData.Reason,
        promotion: promo
          ? {
              promoId: promo.promoId || promo.PromoId,
              promoCode: promo.promoCode || promo.PromoCode,
              discountType: promo.discountType || promo.DiscountType,
              discountValue: promo.discountValue || promo.DiscountValue,
            }
          : undefined,
      };
    } catch (error: any) {
      // Handle error response
      const errorData = error.response?.data?.data || error.response?.data;
      if (errorData?.valid === false) {
        return {
          valid: false,
          reason: errorData.reason || "Mã khuyến mãi không hợp lệ!",
        };
      }
      throw error;
    }
  },

  // Hàm duy nhất để tạo Order (theo Swagger /orders/create)
  createFullOrder: async (payload: {
    userId: number;
    customerId?: number | null;
    promoId?: number | null;
    paymentMethod: "cash" | "card" | "transfer" | "momo" | "vnpay";
    orderItems: { productId: number; quantity: number; price: number }[];
    status?: string;
  }): Promise<Order> => {
    // Backend expects camelCase based on OrderCreateForm.cs
    const camelCasePayload = {
      userId: payload.userId,
      customerId: payload.customerId === null ? null : payload.customerId,
      promoId: payload.promoId === null ? null : payload.promoId,
      paymentMethod: payload.paymentMethod,
      orderItems: payload.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      status: payload.status ?? "paid",
    };

    try {
      const response = await apiClient.post(`/orders/create`, camelCasePayload);
      // Backend returns: { status: 200, message: "...", data: Order }
      const order = response.data?.data || response.data;
      return order;
    } catch (error: any) {
      throw error;
    }
  },

  // Tạo payment request với MoMo
  createMoMoPayment: async (orderId: number, amount: number, returnUrl?: string): Promise<{ payUrl: string; qrCodeUrl?: string }> => {
    try {
      const response = await apiClient.post(`/payments/momo/create`, {
        orderId,
        amount,
        returnUrl: returnUrl || `${window.location.origin}/payment/momo/return`,
        notifyUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5260'}/api/v1/payments/momo/callback`
      });
      const result = response.data?.data || response.data;
      if (result?.payUrl) {
        return result;
      }
      throw new Error(result?.message || "Không thể tạo payment URL");
    } catch (error: any) {
      throw error;
    }
  },

  // Tạo payment request với VNPay
  createVNPayPayment: async (orderId: number, amount: number, returnUrl?: string): Promise<{ paymentUrl: string }> => {
    try {
      const response = await apiClient.post(`/payments/vnpay/create`, {
        orderId,
        amount,
        returnUrl: returnUrl || `${window.location.origin}/payment/vnpay/return`,
        orderInfo: `Thanh toan don hang #${orderId}`
      });
      const result = response.data?.data || response.data;
      if (result?.paymentUrl) {
        return result;
      }
      throw new Error(result?.message || "Không thể tạo payment URL");
    } catch (error: any) {
      throw error;
    }
  },
};
