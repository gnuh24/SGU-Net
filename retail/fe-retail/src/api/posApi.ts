import axios from "axios";

export interface SwaggerProduct {
  productId: number;
  productName: string;
  barcode: string;
  price: number;
  currentStock?: number;
  inventory?: { quantity?: number };
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
  discountType: "percentage" | "fixed_amount" | "fixed";
  discountValue: number;
}
export interface ValidatedPromoResponse {
  valid: boolean;
  promotion: Promotion;
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
    console.error("Phản hồi API không chứa dữ liệu mảng mong đợi:", response);
    throw new Error("Phản hồi API không chứa dữ liệu mảng mong đợi sau khi giải nén.");
  }
  return data;
};

const unwrapSingleData = (response: any): any => { 
  let data = response.data?.data;
  if (data === undefined) {
      data = response.data;
  }

  if (data === null || data === undefined) {
     console.error("Phản hồi API không chứa đối tượng dữ liệu đơn lẻ mong đợi:", response);
     throw new Error("Phản hồi API không chứa đối tượng dữ liệu đơn lẻ mong đợi sau khi giải nén.");
  }
  return data;
};


export const posApi = {
  scanBarcode: (barcode: string): Promise<SwaggerProduct> =>
  apiClient.get(`/products/barcode/${barcode}`).then(response => {
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

  validatePromotion: (
    promoCode: string,
    orderAmount: number
  ): Promise<ValidatedPromoResponse> =>
    apiClient
      .post(`/promotions/validate`, { 
        promo_code: promoCode,
        order_amount: orderAmount,
      })
      .then(unwrapSingleData),

  // Hàm duy nhất để tạo Order (theo Swagger /orders/create)
  createFullOrder: (payload: {
    userId: number;
    customerId?: number | null; 
    promoId?: number | null;    
    paymentMethod: "cash" | "card" | "transfer";
    orderItems: { productId: number; quantity: number; price: number }[];
    status?: string;
   
  }): Promise<Order> => {
    const snakeCasePayload = {
      user_id: payload.userId,
      customer_id: payload.customerId === null ? null : payload.customerId,
      promo_id: payload.promoId === null ? null : payload.promoId,
      payment_method: payload.paymentMethod,
      order_items: payload.orderItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      status: payload.status ?? "paid",
    };
    return apiClient.post(`/orders/create`, snakeCasePayload).then(unwrapSingleData);
  },
};