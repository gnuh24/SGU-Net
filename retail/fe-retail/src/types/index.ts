export interface User {
  id: number;
  username: string;
  full_name: string;
  role: "admin" | "staff";
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  // role luôn là "staff", không cần gửi từ frontend
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  category_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  supplier_id: number;
  product_name: string;
  barcode: string;
  price: number;
  unit: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  supplier?: Supplier;
  inventory?: Inventory;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  quantity: number;
  updated_at: string;
  product?: Product;
}

export interface Promotion {
  id: number;
  promo_code: string;
  description: string;
  discount_type: "percentage" | "percent" | "fixed" | "fixed_amount";
  discount_value: number;
  start_date: string;
  end_date: string;
  min_order_amount?: number;
  usage_limit?: number;
  used_count: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_id?: number;
  user_id: number;
  promo_id?: number;
  total_amount: number;
  discount_amount: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  updated_at: string;
  customer?: Customer;
  user?: User;
  promotion?: Promotion;
  order_items?: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: "cash" | "card" | "transfer";
  amount_paid: number;
  created_at: string;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  stock: number;
}

export interface ValidatedPromoResponse {
  valid: boolean;
  promotion: Promotion;
  reason?: string;
}
export interface CheckoutRequest {
  customer_id?: number;
  promo_id?: number;
  user_id: number;
  items: {
    product_id: number;
    quantity: number;
    price: number;
  }[];
  payment: {
    payment_method: "cash" | "card" | "transfer";
    amount_paid: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserFormData {
  username: string;
  password?: string;
  full_name: string;
  role: "admin" | "staff";
}

export interface ProductFormData {
  category_id: number;
  supplier_id: number;
  product_name: string;
  barcode: string;
  price: number;
  unit: string;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CategoryFormData {
  category_name: string;
  description?: string;
}

export interface SupplierFormData {
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PromotionFormData {
  promo_code: string;
  description: string;
  discount_type: "percentage" | "percent" | "fixed" | "fixed_amount";
  discount_value: number;
  start_date: string;
  end_date: string;
  min_order_amount?: number;
  usage_limit?: number;
}

export interface SalesReport {
  date: string;
  total_revenue: number;
  total_discount: number;
  order_count: number;
}

export interface ProductSalesReport {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface StaffSalesReport {
  user_id: number;
  staff_name: string;
  total_orders: number;
  total_revenue: number;
}
