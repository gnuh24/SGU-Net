// API Base URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "retail_token",
  USER: "retail_user",
  CART: "pos_cart",
  SETTINGS: "app_settings",
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
} as const;

// Discount Types
export const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;

// Promotion Status
export const PROMOTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  DISPLAY_WITH_TIME: "dd/MM/yyyy HH:mm",
  API: "yyyy-MM-dd",
  API_WITH_TIME: "yyyy-MM-dd HH:mm:ss",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ["10", "20", "50", "100"],
} as const;

// Navigation Menu Items
export const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "BarChart3",
    path: "/dashboard",
    roles: ["admin", "staff"],
  },
  {
    key: "pos",
    label: "Bán hàng (POS)",
    icon: "ShoppingCart",
    path: "/pos",
    roles: ["admin", "staff"],
  },
  {
    key: "orders",
    label: "Danh sách hóa đơn",
    icon: "Receipt",
    path: "/orders",
    roles: ["admin", "staff"],
  },
  {
    key: "customers",
    label: "Quản lý khách hàng",
    icon: "Users",
    path: "/customers",
    roles: ["admin", "staff"],
  },
  {
    key: "products",
    label: "Quản lý sản phẩm",
    icon: "Package",
    path: "/products",
    roles: ["admin"],
    children: [
      {
        key: "products-list",
        label: "Danh sách sản phẩm",
        path: "/products",
      },
      {
        key: "categories",
        label: "Danh mục",
        path: "/products/categories",
      },
      {
        key: "suppliers",
        label: "Nhà cung cấp",
        path: "/products/suppliers",
      },
    ],
  },
  {
    key: "inventory",
    label: "Quản lý kho hàng",
    icon: "Warehouse",
    path: "/inventory",
    roles: ["admin", "staff"],
  },
  {
    key: "promotions",
    label: "Quản lý khuyến mãi",
    icon: "Tag",
    path: "/promotions",
    roles: ["admin"],
  },
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: "UserCog",
    path: "/users",
    roles: ["admin"],
  },
  {
    key: "reports",
    label: "Báo cáo & Thống kê",
    icon: "FileText",
    path: "/reports",
    roles: ["admin"],
    children: [
      {
        key: "sales-report",
        label: "Báo cáo doanh thu",
        path: "/reports/sales",
      },
      {
        key: "product-report",
        label: "Sản phẩm bán chạy",
        path: "/reports/products",
      },
      {
        key: "inventory-report",
        label: "Báo cáo tồn kho",
        path: "/reports/inventory",
      },
    ],
  },
] as const;

// Colors
export const COLORS = {
  PRIMARY: "#1890ff",
  SUCCESS: "#52c41a",
  WARNING: "#faad14",
  ERROR: "#ff4d4f",
  INFO: "#1890ff",
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: {
    CREATE: "Tạo mới thành công!",
    UPDATE: "Cập nhật thành công!",
    DELETE: "Xóa thành công!",
    LOGIN: "Đăng nhập thành công!",
    LOGOUT: "Đăng xuất thành công!",
  },
  ERROR: {
    GENERAL: "Có lỗi xảy ra, vui lòng thử lại!",
    NETWORK: "Lỗi kết nối mạng!",
    UNAUTHORIZED: "Bạn không có quyền truy cập!",
    NOT_FOUND: "Không tìm thấy dữ liệu!",
    VALIDATION: "Dữ liệu không hợp lệ!",
    LOGIN_FAILED: "Tên đăng nhập hoặc mật khẩu không đúng!",
  },
  CONFIRM: {
    DELETE: "Bạn có chắc chắn muốn xóa?",
    LOGOUT: "Bạn có chắc chắn muốn đăng xuất?",
  },
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,11}$/,
  BARCODE: /^\d{8,13}$/,
  USERNAME: /^\w{3,20}$/,
  PASSWORD: /^.{6,}$/,
} as const;

// Table Columns Width
export const TABLE_COLUMNS = {
  ACTIONS: 120,
  STATUS: 100,
  DATE: 150,
  CURRENCY: 120,
  QUANTITY: 100,
  ID: 80,
} as const;
