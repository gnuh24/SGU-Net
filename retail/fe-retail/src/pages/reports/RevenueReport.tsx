import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  DatePicker,
  Space,
  Button,
  message,
  Statistic,
  Row,
  Col,
  Select,
  Tag,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { apiService } from "../../services/apiService";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const SalesReport: React.FC = () => {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    previousRevenue: 0,
  });
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const unwrapResponse = (response: any): any => {
    if (response?.data) return response.data;
    return response;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      // Fetch orders in date range
      const ordersRes = await apiService.get("/orders", {
        params: {
          fromDate: startDate,
          toDate: endDate,
          pageSize: 10000,
          status: "paid", // Only count paid orders
        },
      });

      const ordersData = unwrapResponse(ordersRes);
      const orders = Array.isArray(ordersData)
        ? ordersData
        : ordersData?.items || ordersData?.data || [];

      // Group orders by date
      const revenueByDate: {
        [key: string]: { revenue: number; count: number };
      } = {};
      let totalRevenue = 0;
      let totalOrders = 0;

      orders.forEach((order: any) => {
        const orderDate = dayjs(
          order.orderDate ||
            order.order_date ||
            order.createdAt ||
            order.created_at
        ).format("YYYY-MM-DD");
        const amount =
          (order.totalAmount || order.total_amount || 0) -
          (order.discountAmount || order.discount_amount || 0);

        if (!revenueByDate[orderDate]) {
          revenueByDate[orderDate] = { revenue: 0, count: 0 };
        }

        revenueByDate[orderDate].revenue += amount;
        revenueByDate[orderDate].count += 1;

        totalRevenue += amount;
        totalOrders += 1;
      });

      // Convert to array for chart
      const chartArray = Object.keys(revenueByDate)
        .sort()
        .map((date) => ({
          date: dayjs(date).format("DD/MM"),
          fullDate: date,
          revenue: revenueByDate[date].revenue,
          orders: revenueByDate[date].count,
        }));

      setChartData(chartArray);

      // Create daily table data
      const dailyArray = Object.keys(revenueByDate)
        .sort()
        .reverse()
        .map((date, index) => ({
          key: index,
          date: date,
          displayDate: dayjs(date).format("DD/MM/YYYY"),
          dayOfWeek: dayjs(date).format("dddd"),
          revenue: revenueByDate[date].revenue,
          orders: revenueByDate[date].count,
          avgOrderValue:
            revenueByDate[date].revenue / revenueByDate[date].count,
        }));

      setDailyData(dailyArray);

      // Calculate overview stats
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate previous period for comparison
      const daysDiff = dateRange[1].diff(dateRange[0], "day") + 1;
      const prevStartDate = dateRange[0]
        .subtract(daysDiff, "day")
        .format("YYYY-MM-DD");
      const prevEndDate = dateRange[0].subtract(1, "day").format("YYYY-MM-DD");

      const prevOrdersRes = await apiService.get("/orders", {
        params: {
          fromDate: prevStartDate,
          toDate: prevEndDate,
          pageSize: 10000,
          status: "paid", // Only count paid orders
        },
      });

      const prevOrdersData = unwrapResponse(prevOrdersRes);
      const prevOrders = Array.isArray(prevOrdersData)
        ? prevOrdersData
        : prevOrdersData?.items || [];

      const previousRevenue = prevOrders.reduce(
        (sum: number, order: any) =>
          sum +
          ((order.totalAmount || order.total_amount || 0) -
            (order.discountAmount || order.discount_amount || 0)),
        0
      );

      setOverview({
        totalRevenue,
        totalOrders,
        averageOrderValue: avgOrderValue,
        previousRevenue,
      });
    } catch (err: any) {
      message.error(err.message || "Lỗi khi tải báo cáo doanh thu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyFilter = () => {
    fetchData();
  };

  const growth =
    overview.previousRevenue > 0
      ? ((overview.totalRevenue - overview.previousRevenue) /
          overview.previousRevenue) *
        100
      : 0;

  const columns = [
    {
      title: "Ngày",
      dataIndex: "displayDate",
      key: "date",
      width: 120,
    },
    {
      title: "Thứ",
      dataIndex: "dayOfWeek",
      key: "dayOfWeek",
      width: 100,
      render: (text: string) => (
        <span style={{ textTransform: "capitalize" }}>{text}</span>
      ),
    },
    {
      title: "Số đơn hàng",
      dataIndex: "orders",
      key: "orders",
      align: "right" as const,
      width: 120,
      render: (value: number) => (
        <Tag color="blue">{value.toLocaleString()}</Tag>
      ),
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right" as const,
      render: (value: number) => (
        <span style={{ fontWeight: "600", color: "#52c41a" }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: "Giá trị TB/Đơn",
      dataIndex: "avgOrderValue",
      key: "avgOrderValue",
      align: "right" as const,
      render: (value: number) => (
        <span style={{ color: "#8c8c8c" }}>{formatCurrency(value)}</span>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "white",
            padding: "12px",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", marginBottom: 8 }}>
            {payload[0].payload.fullDate}
          </p>
          <p style={{ margin: 0, color: "#52c41a" }}>
            Doanh thu: {formatCurrency(payload[0].value)}
          </p>
          <p style={{ margin: 0, color: "#1890ff" }}>
            Đơn hàng: {payload[1] ? payload[1].value : 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        💰 Báo cáo doanh thu theo thời gian
      </h2>

      {/* Date Range Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <span style={{ fontWeight: 500 }}>Khoảng thời gian:</span>
          <RangePicker
            value={dateRange}
            onChange={(dates: any) => dates && setDateRange(dates)}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button type="primary" onClick={handleApplyFilter} loading={loading}>
            Áp dụng
          </Button>
          <Space>
            <Button
              onClick={() => {
                const newRange: [Dayjs, Dayjs] = [
                  dayjs().startOf("week"),
                  dayjs(),
                ];
                setDateRange(newRange);
              }}
            >
              Tuần này
            </Button>
            <Button
              onClick={() => {
                const newRange: [Dayjs, Dayjs] = [
                  dayjs().startOf("month"),
                  dayjs(),
                ];
                setDateRange(newRange);
              }}
            >
              Tháng này
            </Button>
            <Button
              onClick={() => {
                const newRange: [Dayjs, Dayjs] = [
                  dayjs().subtract(30, "day"),
                  dayjs(),
                ];
                setDateRange(newRange);
              }}
            >
              30 ngày qua
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Overview Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={overview.totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#52c41a" }}
            />
            {growth !== 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ color: growth >= 0 ? "#52c41a" : "#ff4d4f" }}>
                  {growth >= 0 ? <RiseOutlined /> : <FallOutlined />}{" "}
                  {Math.abs(growth).toFixed(1)}% so với kỳ trước
                </span>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={overview.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giá trị TB/Đơn"
              value={overview.averageOrderValue}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số ngày"
              value={dateRange[1].diff(dateRange[0], "day") + 1}
              suffix="ngày"
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="Biểu đồ doanh thu"
        style={{ marginBottom: 24 }}
        extra={
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
          >
            <Option value="line">
              <LineChartOutlined /> Đường
            </Option>
            <Option value="bar">
              <BarChartOutlined /> Cột
            </Option>
          </Select>
        }
      >
        <ResponsiveContainer width="100%" height={400}>
          {chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#52c41a"
                strokeWidth={2}
                name="Doanh thu (VNĐ)"
                dot={{ fill: "#52c41a", r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#1890ff"
                strokeWidth={2}
                name="Số đơn hàng"
                dot={{ fill: "#1890ff", r: 4 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill="#52c41a" name="Doanh thu (VNĐ)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Daily Data Table */}
      <Card title="Chi tiết theo ngày">
        <Table
          dataSource={dailyData}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="key"
          locale={{ emptyText: "Chưa có dữ liệu" }}
          summary={(pageData) => {
            const totalRev = pageData.reduce(
              (sum, item) => sum + item.revenue,
              0
            );
            const totalOrd = pageData.reduce(
              (sum, item) => sum + item.orders,
              0
            );
            const avgOrd = totalOrd > 0 ? totalRev / totalOrd : 0;

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Tổng cộng ({pageData.length} ngày)</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Tag color="blue">
                      <strong>{totalOrd.toLocaleString()}</strong>
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong style={{ color: "#52c41a" }}>
                      {formatCurrency(totalRev)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong style={{ color: "#8c8c8c" }}>
                      {formatCurrency(avgOrd)}
                    </strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default SalesReport;
