# Retail Management System - Frontend

Hệ thống quản lý bán hàng được xây dựng bằng React, TypeScript, Ant Design và Redux Toolkit.

## 🚀 Tính năng chính

### 1. Quản lý Xác thực & Người dùng

- Đăng nhập/đăng xuất với JWT
- Phân quyền (Admin/Staff)
- Quản lý người dùng (CRUD)

### 2. Quản lý Sản phẩm

- Quản lý sản phẩm, danh mục, nhà cung cấp
- Tìm kiếm và lọc sản phẩm
- Quản lý barcode

### 3. Quản lý Khách hàng

- CRUD khách hàng
- Lịch sử mua hàng
- Tìm kiếm theo tên/số điện thoại

### 4. Quản lý Kho hàng

- Xem tồn kho realtime
- Cảnh báo sản phẩm sắp hết
- Nhập kho/điều chỉnh (Admin)

### 5. Quản lý Khuyến mãi

- Tạo mã giảm giá
- Quản lý điều kiện áp dụng
- Theo dõi sử dụng

### 6. POS (Point of Sale)

- Giao diện bán hàng trực quan
- Quét barcode
- Áp dụng khuyến mãi
- Nhiều phương thức thanh toán

### 7. Báo cáo & Thống kê (Admin)

- Báo cáo doanh thu
- Sản phẩm bán chạy
- Báo cáo tồn kho
- Thống kê theo nhân viên

## 🛠️ Công nghệ sử dụng

- **Frontend Framework**: React 18 + TypeScript
- **UI Library**: Ant Design 5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React + Ant Design Icons
- **Charts**: Recharts
- **Forms**: React Hook Form + Yup
- **Date Handling**: date-fns
- **Build Tool**: Vite

## 📁 Cấu trúc thư mục

```
src/
├── assets/                 # Hình ảnh, icons
├── components/            # Components tái sử dụng
│   ├── common/           # Common components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── constants/            # Hằng số, cấu hình
├── hooks/               # Custom hooks
├── pages/               # Các trang chính
│   ├── auth/           # Đăng nhập
│   ├── dashboard/      # Trang chủ
│   ├── users/          # Quản lý người dùng
│   ├── products/       # Quản lý sản phẩm
│   ├── customers/      # Quản lý khách hàng
│   ├── promotions/     # Quản lý khuyến mãi
│   ├── pos/           # Point of Sale
│   └── reports/       # Báo cáo
├── services/           # API services
├── store/             # Redux store
│   └── slices/       # Redux slices
├── types/            # TypeScript types
├── utils/           # Utility functions
└── styles/         # Global styles
```

## 🔧 Cài đặt và chạy

### Prerequisites

- Node.js 18+
- npm hoặc yarn

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd retail/fe-retail

# Cài đặt dependencies
npm install

# Copy environment variables
cp .env.example .env

# Cấu hình API URL trong .env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại http://localhost:3000

### Build production

```bash
npm run build
```

## 🔐 Tài khoản demo

### Admin

- Username: `admin`
- Password: `password`
- Quyền: Toàn quyền truy cập tất cả modules

### Staff

- Username: `staff`
- Password: `password`
- Quyền: Bán hàng, quản lý khách hàng, xem tồn kho

## 🚀 Deployment

### Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại http://localhost:3000

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

Khi không dùng mock data nữa và chuyển sang dùng API thật, đây là những gì cần thay đổi:

🔧 Thay đổi cấu hình

1. Environment Variables
   Thay đổi trong .env hoặc .env.local:
2. Không cần xóa files
   Giữ lại mockAuthService.ts - có thể cần cho testing hoặc development
   Giữ lại mockData - có thể cần cho demo
3. Cập nhật UI (tùy chọn)
   Trong Login.tsx và Register.tsx:
   Xóa phần hiển thị "🧪 Mock Mode Active"
   Xóa phần "Tài khoản demo: admin/password, staff/password"
4. Kiểm tra backend
   Đảm bảo backend API endpoints hoạt động:
   POST /api/v1/auth/login
   POST /api/v1/auth/register
   Kiểm tra CORS configuration cho frontend URL
5. Testing
   Test với Postman hoặc curl trước
   Kiểm tra network tab trong browser để debug API calls
   📋 Checklist chuyển đổi:
   Đổi VITE_USE_MOCK_API=false
   Cập nhật VITE_API_BASE_URL
   Xóa UI mock mode warnings
   Test backend endpoints
   Test đăng nhập/đăng ký qua UI
   Ưu điểm: Code được thiết kế để chỉ cần thay đổi environment variable, logic auth tự động chuyển từ mock sang real API.
