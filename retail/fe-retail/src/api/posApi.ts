// // // src/api/posApi.ts
// // import axios from "axios";
// // import type {
// //   Product,
// //   Customer,
// //   Promotion,
// //   Order,
// //   OrderItem,
// //   Payment,
// // } from "../types"; // Import từ file index của types

// // // Giả định API trả về Product kèm tồn kho cho trang POS
// // type ProductWithInventory = Product & { inventory_quantity: number };

// // const API_BASE_URL = "https://localhost:5620/api/v1";

// // const apiClient = axios.create({
// //   baseURL: API_BASE_URL,
// // });

// // // 🎯 SỬA LỖI: Interceptor sẽ không "mở" data nữa, chỉ trả về response
// // apiClient.interceptors.response.use(
// //   (response) => response, // Trả về response đầy đủ
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // // 🎯 THÊM MỚI: Hàm helper để "mở" data theo logic cũ của bạn
// // // BE có thể trả về { data: ... } hoặc { data: { data: [...] } }
// // const unwrapData = (response: any) => {
// //   if (response.data && typeof response.data.data !== "undefined") {
// //     return response.data.data;
// //   }
// //   return response.data;
// // };


// // export const posApi = {
// //   /**
// //    * Quét barcode (trả về Product kèm tồn kho)
// //    */
// //   scanBarcode: (barcode: string): Promise<ProductWithInventory> => // Thêm kiểu trả về
// //     apiClient.get(`/products/barcode/${barcode}`).then(unwrapData), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Tìm theo tên (trả về mảng Product kèm tồn kho)
// //    */
// //   searchProductsByName: (query: string): Promise<ProductWithInventory[]> => // Thêm kiểu trả về
// //     apiClient.get(`/products/search`, { params: { q: query } }).then(unwrapData), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Lấy danh sách khách hàng
// //    */
// //   getCustomers: (): Promise<Customer[]> => // Thêm kiểu trả về
// //     apiClient.get("/customers").then(res => unwrapData(res) || []), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Kiểm tra mã khuyến mãi
// //    */
// //   validatePromotion: (
// //     promoCode: string,
// //     orderAmount: number
// //   ): Promise<{ valid: boolean; promo: Promotion; reason?: string }> => // Thêm kiểu trả về
// //     apiClient.post("/promotions/validate", { promoCode, orderAmount }).then(unwrapData), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Tạo Order
// //    */
// //   createOrder: (orderData: Partial<Order>): Promise<Order> => // Thêm kiểu trả về
// //     apiClient.post("/orders", orderData).then(unwrapData), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Tạo Order Items (hỗ trợ checkout)
// //    */
// //   createOrderItemsBulk: (itemsData: { items: Partial<OrderItem>[] }): Promise<OrderItem[]> => // Thêm kiểu trả về
// //     apiClient.post("/order-items/bulk", itemsData).then(unwrapData), // 🎯 Sửa: .then(unwrapData)

// //   /**
// //    * Tạo Payment (hỗ trợ checkout)
// //    */
// //   createPayment: (paymentData: Partial<Payment>): Promise<Payment> => // Thêm kiểu trả về
// //     apiClient.post("/payments", paymentData).then(unwrapData), // 🎯 Sửa: .then(unwrapData)
// // };
// // src/api/posApi.ts
// import axios from "axios";
// import type {
//   Product,
//   Customer,
//   Promotion,
//   Order,
//   OrderItem,
//   Payment,
// } from "../types"; 

// type ProductWithInventory = Product & { inventory_quantity: number };

// const API_BASE_URL = "http://localhost:5260/api/v1"; // Cổng 5260

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
// });

// apiClient.interceptors.response.use(
//   (response) => response, 
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // 🎯 SỬA LỖI: Xử lý đúng cấu trúc { data: { data: [...] } }
// const unwrapData = (response: any) => {
//   // 1. Kiểm tra cấu trúc lồng 2 cấp (từ code CustomersPage.tsx)
//   if (response.data && response.data.data && typeof response.data.data.data !== 'undefined') {
//     return response.data.data.data; // Trả về mảng trong cùng
//   }
//   // 2. Kiểm tra cấu trúc lồng 1 cấp (ví dụ: ApiResponse<T>)
//   if (response.data && typeof response.data.data !== 'undefined') {
//     return response.data.data;
//   }
//   // 3. Fallback
//   return response.data;
// };


// export const posApi = {
//   /**
//    * Quét barcode
//    */
//   scanBarcode: (barcode: string): Promise<ProductWithInventory> =>
//     apiClient.get(`/products/barcode/${barcode}`).then(unwrapData),

//   /**
//    * Tìm theo tên
//    */
//   searchProductsByName: (query: string): Promise<ProductWithInventory[]> =>
//     apiClient.get(`/products/search`, { params: { q: query } }).then(unwrapData),

//   /**
//    * Lấy danh sách khách hàng
//    */
//   getCustomers: (): Promise<Customer[]> =>
//     apiClient.get("/customers").then(res => unwrapData(res) || []),

//   /**
//    * Kiểm tra mã khuyến mãi
//    */
//   validatePromotion: (
//     promoCode: string,
//     orderAmount: number
//   ): Promise<{ valid: boolean; promo: Promotion; reason?: string }> =>
//     apiClient.post("/promotions/validate", { promoCode, orderAmount }).then(unwrapData),

//   /**
//    * Tạo Order
//    */
//   createOrder: (orderData: Partial<Order>): Promise<Order> =>
//     apiClient.post("/orders", orderData).then(unwrapData),

//   /**
//    * Tạo Order Items
//    */
//   createOrderItemsBulk: (itemsData: { items: Partial<OrderItem>[] }): Promise<OrderItem[]> =>
//     apiClient.post("/order-items/bulk", itemsData).then(unwrapData),

//   /**
//    * Tạo Payment
//    */
//   createPayment: (paymentData: Partial<Payment>): Promise<Payment> =>
//     apiClient.post("/payments", paymentData).then(unwrapData),
// };

// src/api/posApi.ts
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