import React from "react";
import { Card, Row, Col, Statistic, Typography, Progress } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Tag,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/helpers";

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with real API calls
  const stats = {
    todayRevenue: 15420000,
    todayOrders: 45,
    totalCustomers: 1234,
    lowStockProducts: 12,
    revenueGrowth: 12.5,
    ordersGrowth: -5.2,
    customersGrowth: 8.3,
  };

  const recentOrders = [
    { id: 1, customer: "Nguyễn Văn A", amount: 450000, time: "10:30" },
    { id: 2, customer: "Trần Thị B", amount: 320000, time: "10:25" },
    { id: 3, customer: "Khách vãng lai", amount: 150000, time: "10:20" },
    { id: 4, customer: "Lê Văn C", amount: 890000, time: "10:15" },
  ];

  const lowStockProducts = [
    { name: "Nước ngọt Coca Cola", stock: 5, threshold: 20 },
    { name: "Bánh mì sandwich", stock: 3, threshold: 15 },
    { name: "Kem Magnum", stock: 8, threshold: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Title level={2} className="mb-2 text-gray-800">
          Chào mừng trở lại, {user?.full_name}! 👋
        </Title>
        <Text type="secondary" className="text-base">
          Tổng quan hoạt động kinh doanh hôm nay
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={stats.todayRevenue}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarSign size={20} className="text-green-500" />}
              suffix={
                <span
                  className={`text-sm ${
                    stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {Math.abs(stats.revenueGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng hôm nay"
              value={stats.todayOrders}
              prefix={<ShoppingCart size={20} className="text-blue-500" />}
              suffix={
                <span
                  className={`text-sm ${
                    stats.ordersGrowth >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stats.ordersGrowth >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {Math.abs(stats.ordersGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={stats.totalCustomers}
              prefix={<Users size={20} className="text-purple-500" />}
              suffix={
                <span className="text-sm text-green-500">
                  <TrendingUp size={14} />
                  {stats.customersGrowth}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sản phẩm sắp hết"
              value={stats.lowStockProducts}
              prefix={<AlertTriangle size={20} className="text-orange-500" />}
              valueStyle={{ color: "#f59e0b" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Orders */}
        <Col xs={24} lg={12}>
          <Card
            title="Đơn hàng gần đây"
            extra={
              <Text type="secondary" className="text-sm">
                Cập nhật realtime
              </Text>
            }
          >
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-sm text-gray-500">
                      #{order.id} - {order.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(order.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Low Stock Alert */}
        <Col xs={24} lg={12}>
          <Card
            title="Cảnh báo tồn kho"
            extra={
              <Text type="secondary" className="text-sm">
                Sản phẩm sắp hết hàng
              </Text>
            }
          >
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.name}>
                  <div className="flex justify-between items-center mb-2">
                    <Text strong className="text-sm">
                      {product.name}
                    </Text>
                    <Text className="text-sm">
                      {product.stock}/{product.threshold}
                    </Text>
                  </div>
                  <Progress
                    percent={(product.stock / product.threshold) * 100}
                    size="small"
                    status={
                      product.stock <= product.threshold * 0.3
                        ? "exception"
                        : "normal"
                    }
                    strokeColor={
                      product.stock <= product.threshold * 0.3
                        ? "#f5222d"
                        : "#faad14"
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions - Only for admin */}
      {isAdmin() && (
        <Card title="Thao tác nhanh">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/products")}
              >
                <Package size={32} className="mx-auto mb-2 text-blue-500" />
                <div className="font-medium">Thêm sản phẩm</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/promotions")}
              >
                <Tag size={32} className="mx-auto mb-2 text-green-500" />
                <div className="font-medium">Tạo khuyến mãi</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/users")}
              >
                <Users size={32} className="mx-auto mb-2 text-purple-500" />
                <div className="font-medium">Quản lý user</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/reports")}
              >
                <BarChart3 size={32} className="mx-auto mb-2 text-orange-500" />
                <div className="font-medium">Xem báo cáo</div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
