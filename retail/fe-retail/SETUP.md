# HƯỚNG DẪN SETUP DỰ ÁN RETAIL MANAGEMENT SYSTEM

## 🎯 Tổng quan dự án đã tạo

Tôi đã tạo hoàn chỉnh cấu trúc dự án React cho hệ thống quản lý bán hàng với các tính năng sau:

### ✅ Cấu trúc dự án chuyên nghiệp

```
fe-retail/
├── src/
│   ├── components/           # Components tái sử dụng
│   │   ├── common/          # Common components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components (Sidebar, Header, AppLayout)
│   ├── pages/               # Các trang chính
│   │   ├── auth/           # Login page
│   │   ├── dashboard/      # Dashboard
│   │   ├── users/          # Quản lý người dùng
│   │   ├── products/       # Quản lý sản phẩm
│   │   ├── customers/      # Quản lý khách hàng
│   │   ├── inventory/      # Quản lý kho hàng
│   │   ├── promotions/     # Quản lý khuyến mãi
│   │   ├── pos/           # Point of Sale
│   │   └── reports/       # Báo cáo
│   ├── services/           # API services
│   │   ├── apiService.ts   # Base API service
│   │   ├── authService.ts  # Authentication
│   │   └── userService.ts  # User management
│   ├── store/             # Redux store
│   │   ├── slices/        # Redux slices
│   │   │   ├── authSlice.ts
│   │   │   └── posSlice.ts
│   │   └── index.ts       # Store configuration
│   ├── hooks/             # Custom hooks
│   │   ├── redux.ts       # Redux hooks
│   │   └── useAuth.ts     # Auth hook
│   ├── types/             # TypeScript types
│   │   └── index.ts       # All interfaces
│   ├── constants/         # Constants & config
│   │   └── index.ts       # App constants
│   ├── utils/            # Utility functions
│   │   └── helpers.ts    # Helper functions
│   └── assets/           # Static assets
├── public/               # Public files
├── .env                 # Environment variables
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind config
├── tsconfig.json        # TypeScript config
└── README.md           # Documentation
```

### ✅ Công nghệ đã setup

- **React 18** + **TypeScript**
- **Ant Design 5** - UI Framework
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hook Form** + **Yup** - Forms
- **Recharts** - Charts
- **Vite** - Build tool

### ✅ Các module đã implement

1. **Authentication & User Management**

   - Login page với JWT
   - Role-based access control (Admin/Staff)
   - User CRUD operations

2. **Layout System**

   - Responsive sidebar navigation
   - Header with user menu
   - Protected routes
   - Role-based menu items

3. **Dashboard**

   - Sales statistics
   - Recent orders
   - Low stock alerts
   - Quick actions

4. **State Management**
   - Auth state (login/logout)
   - POS cart state
   - Global app state

### ✅ Các tính năng chính

- **Phân quyền**: Admin có full access, Staff chỉ có quyền bán hàng và quản lý khách hàng
- **Responsive Design**: Tối ưu cho desktop, tablet, mobile
- **Dark/Light UI**: Sử dụng Ant Design theme
- **Type Safety**: Full TypeScript support
- **API Integration**: Ready cho kết nối với backend
- **Form Validation**: Validation với Yup schema
- **Error Handling**: Global error handling
- **Loading States**: Loading indicators

## 🚀 Cách chạy dự án

### 1. Cài đặt dependencies

```bash
cd e:\SGU-Net\retail\fe-retail
npm install
```
> 💡 **Lưu ý:**  
> Một số phiên bản Linux có thể không chạy được npm install ngay từ đầu. Nếu không chạy được `npm install`, hãy thử các bước sau:

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. Cấu hình environment

File `.env` đã được tạo với:

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Retail Management System
VITE_APP_VERSION=1.0.0
```

### 3. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:3000

### 4. Login demo

- **Admin**: username: `admin`, password: `password`
- **Staff**: username: `staff`, password: `password`

## 📋 Tiếp theo cần làm

### 1. Tạo các page components

- User Management page
- Product Management page
- Customer Management page
- Inventory Management page
- Promotion Management page
- POS interface
- Reports pages

### 2. API Integration

- Kết nối với backend API
- Implement các service methods
- Handle API errors

### 3. Advanced Features

- Real-time notifications
- Barcode scanning
- Print receipts
- Export reports
- Inventory alerts

### 4. Testing & Deployment

- Unit tests
- Integration tests
- Production build
- Docker deployment

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive**: Works on all screen sizes
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Optimized bundle size
- **User Experience**: Intuitive navigation, clear feedback

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Input validation
- XSS protection
- Secure API calls

## 📱 Mobile Responsive

- Collapsible sidebar on mobile
- Touch-friendly interfaces
- Optimized layouts
- Mobile POS interface

## 🛠️ Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vite**: Fast development
- **Hot Reload**: Instant updates

Dự án đã được setup hoàn chỉnh với cấu trúc chuyên nghiệp, ready để phát triển các tính năng cụ thể cho từng module!
