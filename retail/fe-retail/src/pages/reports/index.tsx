import React from "react";
import { Card, Row, Col } from "antd";
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ReportsIndex: React.FC = () => {
  const navigate = useNavigate();

  const reports = [
    {
      title: "Báo cáo tổng quan",
      icon: <FileTextOutlined style={{ fontSize: 48, color: "#1890ff" }} />,
      description: "Xem tổng quan doanh thu, đơn hàng, khách hàng",
      path: "/reports/dashboard",
    },
    {
      title: "Báo cáo doanh thu",
      icon: <ShoppingCartOutlined style={{ fontSize: 48, color: "#52c41a" }} />,
      description: "Chi tiết bán hàng theo sản phẩm",
      path: "/reports/sales",
    },
    {
      title: "Sản phẩm bán chạy",
      icon: <FileTextOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />,
      description: "Top sản phẩm bán chạy nhất",
      path: "/reports/products",
    },
    {
      title: "Báo cáo khách hàng",
      icon: <UserOutlined style={{ fontSize: 48, color: "#722ed1" }} />,
      description: "Thống kê theo khách hàng",
      path: "/reports/customers",
    },
    {
      title: "Báo cáo tồn kho",
      icon: <InboxOutlined style={{ fontSize: 48, color: "#fa8c16" }} />,
      description: "Tình trạng tồn kho sản phẩm",
      path: "/reports/inventory",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        📊 Báo cáo và Thống kê
      </h2>

      <Row gutter={[24, 24]}>
        {reports.map((report) => (
          <Col xs={24} sm={12} md={8} lg={6} key={report.path}>
            <Card
              hoverable
              onClick={() => navigate(report.path)}
              style={{
                textAlign: "center",
                cursor: "pointer",
                height: "100%",
              }}
            >
              <div style={{ marginBottom: 16 }}>{report.icon}</div>
              <h3
                style={{ fontSize: "18px", fontWeight: "600", marginBottom: 8 }}
              >
                {report.title}
              </h3>
              <p style={{ color: "#8c8c8c", margin: 0 }}>
                {report.description}
              </p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ReportsIndex;
