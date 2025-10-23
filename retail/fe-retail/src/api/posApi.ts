import axios from "axios";
import type {
  Customer,
  Promotion,
  Order,
  OrderItem,
  Payment,
} from "../types"; 

// Định nghĩa interface Product đúng như Swagger trả về
export interface SwaggerProduct {
  productId: number;
  productName: string;
  barcode: string;
  price: number;
  inventory: {
    quantity: number;
  };
  // Thêm các trường khác nếu API trả về (như category, supplier...)
}

const API_BASE_URL = "http://localhost:5260/api/v1"; // Cổng 5260

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// 🎯 SỬA: Hàm "mở" cho response dạng danh sách SẢN PHẨM { data: { items: [...] } }
const unwrapProductListData = (response: any) => {
  if (response.data && response.data.data && typeof response.data.data.items !== 'undefined') {
    return response.data.data.items; // Trả về mảng 'items'
  }
  // Fallback nếu cấu trúc khác
  if (response.data && typeof response.data.data !== 'undefined') {
    return response.data.data;
  }
  return response.data;
};

// 🎯 SỬA: Hàm "mở" cho response dạng danh sách KHÁCH HÀNG { data: { data: [...] } }
const unwrapCustomerListData = (response: any) => {
  if (response.data && response.data.data && typeof response.data.data.data !== 'undefined') {
    return response.data.data.data; // Trả về mảng 'data.data'
  }
  // Fallback
  if (response.data && typeof response.data.data !== 'undefined') {
    return response.data.data;
  }
  return response.data;
};

// Hàm "mở" cho response dạng một đối tượng (không có 'items')
const unwrapSingleData = (response: any) => {
  if (response.data && typeof response.data.data !== 'undefined') {
    return response.data.data;
  }
  return response.data;
};


export const posApi = {
  /**
   * Quét barcode
   */
  scanBarcode: (barcode: string): Promise<SwaggerProduct> => 
    apiClient.get(`/products/barcode/${barcode}`).then(unwrapSingleData),

  /**
   * Lấy TẤT CẢ sản phẩm (theo Swagger)
   */
  getAllProducts: (): Promise<SwaggerProduct[]> => 
    apiClient.get(`/products`).then(unwrapProductListData), // 🎯 SỬA: Dùng unwrapProductListData

  /**
   * Lấy danh sách khách hàng
   */
  getCustomers: (): Promise<Customer[]> =>
    apiClient.get("/customers").then(unwrapCustomerListData), // 🎯 SỬA: Dùng unwrapCustomerListData

  /**
   * Kiểm tra mã khuyến mãi
   */
  validatePromotion: (
    promoCode: string,
    orderAmount: number
  ): Promise<{ valid: boolean; promo: Promotion; reason?: string }> =>
    apiClient.post("/promotions/validate", { promoCode, orderAmount }).then(unwrapSingleData),

  /**
   * Tạo Order
   */
  createOrder: (orderData: Partial<Order>): Promise<Order> =>
    apiClient.post("/orders", orderData).then(unwrapSingleData),

  /**
   * Tạo Order Items
   */
  createOrderItemsBulk: (itemsData: { items: Partial<OrderItem>[] }): Promise<OrderItem[]> =>
    apiClient.post("/order-items/bulk", itemsData).then(unwrapSingleData),

  /**
   * Tạo Payment
   */
  createPayment: (paymentData: Partial<Payment>): Promise<Payment> =>
    apiClient.post("/payments", paymentData).then(unwrapSingleData),
};