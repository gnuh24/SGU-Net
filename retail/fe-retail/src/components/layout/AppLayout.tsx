import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Layout } from "antd";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "./Sidebar";
import Header from "./Header";

const { Content, Footer } = Layout;

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ height: "100vh", display: "flex" }}>
      <Sidebar />
      <Layout style={{ display: "flex", flexDirection: "column" }}>
        <Header />
        <Content
          className="p-6 bg-gray-50"
          style={{ flex: 1, overflowY: "auto" }}
        >
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </Content>
        <Footer
          className="text-center bg-white border-t border-gray-200 py-4"
          style={{ flexShrink: 0 }}
        >
          <div className="text-gray-600">
            © 2025 Retail Management System. <span className="mx-2">|</span>{" "}
            Phiên bản 1.0.0 <span className="mx-2">|</span> Được phát triển bởi{" "}
            <span className="text-blue-600 font-medium">SGU Team</span>
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
