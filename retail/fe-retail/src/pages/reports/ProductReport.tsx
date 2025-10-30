import React, { useEffect, useState } from "react";
import { Card, Table, DatePicker, Space, Button, message, Select } from "antd";
import { reportService } from "../../services/reportService";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const ProductReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [topCount, setTopCount] = useState<number>(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const result = await reportService.getProductStatistics({
        startDate,
        endDate,
        top: topCount,
      });

      const items = result.items || result.data || result || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error("Error fetching product report:", err);
      message.error(err.message || "Lỗi khi tải báo cáo sản phẩm");
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

  const columns = [
    {
      title: "Hạng",
      key: "rank",
      width: 80,
      render: (_: any, __: any, index: number) => {
        const rank = index + 1;
        let badge = "";
        if (rank === 1) badge = "🥇";
        else if (rank === 2) badge = "🥈";
        else if (rank === 3) badge = "🥉";
        return (
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>
            {badge} #{rank}
          </span>
        );
      },
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
      render: (text: any, record: any) => {
        const qty =
          record.totalQuantitySold ||
          record.total_quantity_sold ||
          record.totalQuantity ||
          record.total_quantity ||
          record.quantity ||
          0;
        return (
          <span style={{ fontWeight: "600", color: "#1890ff" }}>
            {qty.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right" as const,
      render: (text: any, record: any) => {
        const revenue =
          record.totalRevenue || record.total_revenue || record.revenue || 0;
        return (
          <span style={{ fontWeight: "600", color: "#52c41a" }}>
            {formatCurrency(revenue)}
          </span>
        );
      },
    },
    {
      title: "% Doanh thu",
      key: "percentage",
      align: "right" as const,
      render: (_: any, record: any, index: number) => {
        const totalRevenue = data.reduce(
          (sum, item) =>
            sum +
            (item.totalRevenue || item.total_revenue || item.revenue || 0),
          0
        );
        const revenue =
          record.totalRevenue || record.total_revenue || record.revenue || 0;
        const percentage =
          totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : "0";
        return <span style={{ color: "#fa8c16" }}>{percentage}%</span>;
      },
    },
  ];

  // Calculate summary stats
  const totalQuantity = data.reduce(
    (sum, item) =>
      sum +
      (item.totalQuantitySold ||
        item.total_quantity_sold ||
        item.totalQuantity ||
        item.total_quantity ||
        item.quantity ||
        0),
    0
  );
  const totalRevenue = data.reduce(
    (sum, item) =>
      sum + (item.totalRevenue || item.total_revenue || item.revenue || 0),
    0
  );

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        🏆 Sản phẩm bán chạy
      </h2>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ fontWeight: 500, marginRight: 8 }}>
              Khoảng thời gian:
            </span>
            <RangePicker
              value={dateRange}
              onChange={(dates: any) => dates && setDateRange(dates)}
              format="DD/MM/YYYY"
              allowClear={false}
            />
          </div>
          <div>
            <span style={{ fontWeight: 500, marginRight: 8 }}>Hiển thị:</span>
            <Select
              value={topCount}
              onChange={setTopCount}
              style={{ width: 120 }}
            >
              <Option value={5}>Top 5</Option>
              <Option value={10}>Top 10</Option>
              <Option value={20}>Top 20</Option>
              <Option value={50}>Top 50</Option>
            </Select>
          </div>
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
            }}
          >
            Tháng này
          </Button>
        </Space>
      </Card>

      {/* Summary Stats */}
      <Card style={{ marginBottom: 24, background: "#f0f2f5" }}>
        <Space size="large" split={<span style={{ color: "#d9d9d9" }}>|</span>}>
          <div>
            <span style={{ color: "#8c8c8c", marginRight: 8 }}>
              Tổng sản phẩm:
            </span>
            <span style={{ fontWeight: "600", fontSize: "16px" }}>
              {data.length}
            </span>
          </div>
          <div>
            <span style={{ color: "#8c8c8c", marginRight: 8 }}>
              Tổng số lượng bán:
            </span>
            <span
              style={{ fontWeight: "600", fontSize: "16px", color: "#1890ff" }}
            >
              {totalQuantity.toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ color: "#8c8c8c", marginRight: 8 }}>
              Tổng doanh thu:
            </span>
            <span
              style={{ fontWeight: "600", fontSize: "16px", color: "#52c41a" }}
            >
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </Space>
      </Card>

      {/* Data Table */}
      <Card>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          rowKey={(record) =>
            record.productId || record.product_id || record.id
          }
          locale={{ emptyText: "Chưa có dữ liệu" }}
          rowClassName={(record, index) => {
            if (index === 0) return "bg-yellow-50";
            if (index === 1) return "bg-gray-50";
            if (index === 2) return "bg-orange-50";
            return "";
          }}
        />
      </Card>
    </div>
  );
};

export default ProductReport;
