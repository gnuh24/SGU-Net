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
import Dashboard from "./pages/dashboard/Dashboard";
import RoleGuard from "./components/auth/RoleGuard";

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

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

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

          {/* Promotions (Admin only) */}
          <Route
            path="promotions"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <PromotionsList />
              </RoleGuard>
            }
          />
          <Route
            path="promotions/new"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <PromotionForm />
              </RoleGuard>
            }
          />
          <Route
            path="promotions/:id/edit"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <PromotionForm />
              </RoleGuard>
            }
          />

          {/* Reports (Admin only) */}
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <ReportsDashboard />
              </RoleGuard>
            }
          />
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
