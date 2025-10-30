import React, { useEffect, useState } from "react";
import { Card, Table, DatePicker, Space, Button, message } from "antd";
import { reportService } from "../../services/reportService";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const CustomerReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const fetchData = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const result = await reportService.getCustomerStatistics({
        startDate,
        endDate,
        page,
        pageSize,
      });

      const items = result.items || result.data || [];
      const total = result.total || items.length;

      setData(items);
      setPagination({ current: page, pageSize, total });
    } catch (err: any) {
      console.error("Error fetching customer report:", err);
      message.error(err.message || "Lỗi khi tải báo cáo khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (paginationConfig: any) => {
    fetchData(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleApplyFilter = () => {
    fetchData(1, pagination.pageSize);
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Tên khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      render: (text: string, record: any) =>
        record.customerName || record.customer_name || text || "Khách vãng lai",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (text: string, record: any) =>
        record.phoneNumber || record.phone_number || text || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Tổng đơn hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "right" as const,
      render: (text: any, record: any) =>
        (record.totalOrders || record.total_orders || 0).toLocaleString(),
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      align: "right" as const,
      render: (text: any, record: any) => {
        const amount =
          record.totalSpent || record.total_spent || record.totalRevenue || 0;
        return formatCurrency(amount);
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        👥 Báo cáo khách hàng
      </h2>

      {/* Date Range Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
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

      {/* Data Table */}
      <Card>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey={(record) =>
            record.customerId || record.customer_id || record.id
          }
          locale={{ emptyText: "Chưa có dữ liệu" }}
        />
      </Card>
    </div>
  );
};

export default CustomerReport;
