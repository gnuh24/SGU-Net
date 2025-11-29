import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { store } from "./store";
import { useAppDispatch } from "./hooks/redux";
import { loginSuccess } from "./store/slices/authSlice";
import { STORAGE_KEYS } from "./constants";
import { useAuth } from "./hooks/useAuth";

// Layouts
import AppLayout from "./components/layout/AppLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UsersList from "./pages/users/UsersList";
import UserForm from "./pages/users/UserForm";
import PromotionsList from "./pages/promotions/PromotionsList";
import PromotionForm from "./pages/promotions/PromotionForm";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import ReportsIndex from "./pages/reports/index";
import RevenueReport from "./pages/reports/RevenueReport";
import ProductReport from "./pages/reports/ProductReport";
import CustomerReport from "./pages/reports/CustomerReport";
import InventoryReport from "./pages/reports/InventoryReport";
import OrdersList from "./pages/orders/OrdersList";
import Dashboard from "./pages/dashboard/Dashboard";
import RoleGuard from "./components/auth/RoleGuard";
import ProductList from "./pages/products/ProductList";
import CategoryList from "./pages/categories/CategoryList";
import SupplierList from "./pages/suppliers/SupplierList";
import InventoryList from "./pages/inventories/InventoryList";
import Customers from "./pages/customers/Customers";
import Pos from "./pages/pos/Pos";
import MoMoReturn from "./pages/payment/MoMoReturn";
import VNPayReturn from "./pages/payment/VNPayReturn";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(loginSuccess({ user, token }));
      } catch (error) {
        // Clear invalid data on JSON parse error
        console.warn("Failed to parse stored user data:", error);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  }, [dispatch]);

  // Default route component based on user role
  const DefaultRoute = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') {
      return <Navigate to="/users" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/momo/return" element={<MoMoReturn />} />
        <Route path="/payment/vnpay/return" element={<VNPayReturn />} />

        {/* Protected routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DefaultRoute />} />
          <Route
            path="dashboard"
            element={
              <RoleGuard allowedRoles={["manager", "staff"]}>
                <Dashboard />
              </RoleGuard>
            }
          />

          {/* Users (Admin only) */}
          <Route
            path="users"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <UsersList />
              </RoleGuard>
            }
          />
          <Route
            path="users/new"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <UserForm />
              </RoleGuard>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <UserForm />
              </RoleGuard>
            }
          />

          {/* Orders (Admin, Manager & Staff) */}
          <Route
            path="orders"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "staff"]}>
                <OrdersList />
              </RoleGuard>
            }
          />

          {/* Promotions (Admin & Manager) */}
          <Route
            path="promotions"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <PromotionsList />
              </RoleGuard>
            }
          />
          <Route
            path="promotions/new"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <PromotionForm />
              </RoleGuard>
            }
          />
          <Route
            path="promotions/:id/edit"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <PromotionForm />
              </RoleGuard>
            }
          />

          {/* Reports (Admin & Manager) */}
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <ReportsIndex />
              </RoleGuard>
            }
          />
          <Route
            path="reports/dashboard"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <ReportsDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="reports/sales"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <RevenueReport />
              </RoleGuard>
            }
          />
          <Route
            path="reports/products"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <ProductReport />
              </RoleGuard>
            }
          />
          <Route
            path="reports/customers"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <CustomerReport />
              </RoleGuard>
            }
          />
          <Route
            path="reports/inventory"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <InventoryReport />
              </RoleGuard>
            }
          />

          {/* Products */}
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="suppliers" element={<SupplierList />} />
          </Route>

          {/* Inventory */}
          <Route path="inventory" element={<InventoryList />} />

          {/* Customers */}
          <Route path="customers" element={<Customers />} />

          {/* POS */}
          <Route path="pos" element={<Pos />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#1890ff",
              borderRadius: 6,
            },
          }}
        >
          <AppContent />
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
