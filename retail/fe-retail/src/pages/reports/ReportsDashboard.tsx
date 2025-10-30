import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  message,
  Statistic,
  DatePicker,
  Space,
  Button,
  Spin,
  Empty,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { reportService } from "../../services/reportService";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const ReportsDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const fetchReports = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const [overviewData, productsData] = await Promise.all([
        reportService.getOverview(startDate, endDate),
        reportService.getTopProducts(10),
      ]);

      setOverview(overviewData || {});
      setTopProducts(productsData || []);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      message.error(
        err.response?.data?.message || err.message || "Lỗi khi tải báo cáo"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");
    fetchReports(startDate, endDate);
  }, []);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleApplyFilter = () => {
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");
    fetchReports(startDate, endDate);
  };

  const productColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text: string, record: any) =>
        record.productName || record.product_name || text || "N/A",
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text: string, record: any) =>
        record.categoryName || record.category_name || text || "N/A",
    },
    {
      title: "Số lượng bán",
      dataIndex: "totalQuantitySold",
      key: "totalQuantitySold",
      align: "right" as const,
      render: (text: any, record: any) =>
        (
          record.totalQuantitySold ||
          record.total_quantity_sold ||
          record.totalQuantity ||
          record.total_quantity ||
          record.quantity ||
          0
        ).toLocaleString(),
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right" as const,
      render: (text: any, record: any) => {
        const revenue =
          record.totalRevenue || record.total_revenue || record.revenue || 0;
        return formatCurrency(revenue);
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        📊 Báo cáo & Thống kê
      </h2>

      {/* Date Range Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <span style={{ fontWeight: 500 }}>Khoảng thời gian:</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button type="primary" onClick={handleApplyFilter} loading={loading}>
            Áp dụng
          </Button>
          <Button
            onClick={() => {
              const newRange: [Dayjs, Dayjs] = [
                dayjs().startOf("month"),
                dayjs(),
              ];
              setDateRange(newRange);
              fetchReports(
                newRange[0].format("YYYY-MM-DD"),
                newRange[1].format("YYYY-MM-DD")
              );
            }}
          >
            Tháng này
          </Button>
        </Space>
      </Card>

      {/* Overview Statistics */}
      <Spin spinning={loading}>
        {overview ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng doanh thu"
                    value={overview.totalRevenue || 0}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng đơn hàng"
                    value={overview.totalOrders || 0}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Tổng khách hàng"
                    value={overview.totalCustomers || 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Giá trị TB / Đơn"
                    value={overview.averageOrderValue || 0}
                    prefix={<LineChartOutlined />}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: "#fa8c16" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Top Products Table */}
            <Card
              title="🏆 Top 10 sản phẩm bán chạy nhất"
              style={{ marginBottom: 24 }}
            >
              {topProducts && topProducts.length > 0 ? (
                <Table
                  dataSource={topProducts}
                  columns={productColumns}
                  pagination={false}
                  rowKey={(record) =>
                    record.productId || record.product_id || record.id
                  }
                  size="middle"
                  locale={{
                    emptyText: <Empty description="Chưa có dữ liệu" />,
                  }}
                />
              ) : (
                <Empty description="Chưa có dữ liệu sản phẩm" />
              )}
            </Card>
          </>
        ) : (
          !loading && (
            <Empty
              description="Không có dữ liệu báo cáo"
              style={{ marginTop: 40 }}
            />
          )
        )}
      </Spin>
    </div>
  );
};

export default ReportsDashboard;
