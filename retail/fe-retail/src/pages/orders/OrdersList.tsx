import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Descriptions,
  DatePicker,
  Input,
  Select,
  message,
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { apiService } from "../../services/apiService";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Order {
  orderId: number;
  orderDate: string;
  customerName?: string;
  customerId: number;
  totalAmount: number;
  discountAmount: number;
  status: string;
  userName?: string;
  promoName?: string;
  orderItems?: OrderItem[];
  payment?: Payment;
}

interface OrderItem {
  orderItemId: number;
  productName: string;
  quantity: number;
  price: number;
}

interface Payment {
  paymentId: number;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const unwrapResponse = (response: any): any => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  const fetchOrders = async (page: number = 1, pageSize: number = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const response = await apiService.get("/orders", { params });
      const data = unwrapResponse(response);

      let ordersList = [];
      let total = 0;

      if (Array.isArray(data)) {
        ordersList = data;
        total = data.length;
      } else if (data.items) {
        ordersList = data.items;
        total = data.total || data.items.length;
      } else if (data.data) {
        ordersList = data.data;
        total = data.total || data.data.length;
      }

      setOrders(ordersList);
      setPagination({ current: page, pageSize, total });
    } catch (error: any) {
      message.error("Lỗi khi tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    try {
      const response = await apiService.get(`/orders/${orderId}`);
      const data = unwrapResponse(response);
      setSelectedOrder(data);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error("Lỗi khi tải chi tiết hóa đơn");
    }
  };

  const handleTableChange = (paginationConfig: any) => {
    fetchOrders(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({
      search: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
    setTimeout(() => fetchOrders(1, pagination.pageSize), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "orange";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Tiền mặt";
      case "card":
        return "Thẻ";
      case "transfer":
        return "Chuyển khoản";
      default:
        return method;
    }
  };

  const columns = [
    {
      title: "Mã HĐ",
      dataIndex: "orderId",
      key: "orderId",
      width: 80,
      render: (id: number) => `#${id}`,
    },
    {
      title: "Ngày tạo",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      render: (name: string) => name || "Khách vãng lai",
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right" as const,
      width: 130,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: "Giảm giá",
      dataIndex: "discountAmount",
      key: "discountAmount",
      align: "right" as const,
      width: 120,
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: "Thành tiền",
      key: "finalAmount",
      align: "right" as const,
      width: 130,
      render: (_: any, record: Order) =>
        formatCurrency(record.totalAmount - (record.discountAmount || 0)),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "userName",
      key: "userName",
      render: (name: string) => name || "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: Order) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => fetchOrderDetail(record.orderId)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            Danh sách hóa đơn
          </h2>

          {/* Filters */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Input
                placeholder="Tìm theo mã HĐ, khách hàng..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Select
                placeholder="Trạng thái"
                value={filters.status || undefined}
                onChange={(value) => setFilters({ ...filters, status: value })}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value="paid">Đã thanh toán</Option>
                <Option value="pending">Chờ thanh toán</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <RangePicker
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
                onChange={(dates) => {
                  if (dates) {
                    setFilters({
                      ...filters,
                      fromDate: dates[0]?.format("YYYY-MM-DD") || "",
                      toDate: dates[1]?.format("YYYY-MM-DD") || "",
                    });
                  } else {
                    setFilters({ ...filters, fromDate: "", toDate: "" });
                  }
                }}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  Đặt lại
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="orderId"
          scroll={{ x: 1200 }}
          locale={{ emptyText: "Chưa có hóa đơn nào" }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <span className="text-lg font-semibold">
            Chi tiết hóa đơn #{selectedOrder?.orderId}
          </span>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedOrder(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Order Info */}
            <Card title="Thông tin hóa đơn" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Mã hóa đơn">
                  #{selectedOrder.orderId}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(selectedOrder.orderDate).format("DD/MM/YYYY HH:mm:ss")}
                </Descriptions.Item>
                <Descriptions.Item label="Khách hàng">
                  {selectedOrder.customerName || "Khách vãng lai"}
                </Descriptions.Item>
                <Descriptions.Item label="Nhân viên">
                  {selectedOrder.userName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Khuyến mãi">
                  {selectedOrder.promoName || "Không có"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Order Items */}
            <Card title="Sản phẩm" size="small">
              <Table
                dataSource={selectedOrder.orderItems || []}
                pagination={false}
                size="small"
                rowKey="orderItemId"
                columns={[
                  {
                    title: "Sản phẩm",
                    dataIndex: "productName",
                    key: "productName",
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "center",
                    width: 100,
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "price",
                    key: "price",
                    align: "right",
                    width: 130,
                    render: (price: number) => formatCurrency(price),
                  },
                  {
                    title: "Thành tiền",
                    key: "total",
                    align: "right",
                    width: 130,
                    render: (_: any, record: OrderItem) =>
                      formatCurrency(record.quantity * record.price),
                  },
                ]}
              />
            </Card>

            {/* Payment Info */}
            {selectedOrder.payment && (
              <Card title="Thông tin thanh toán" size="small">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Phương thức">
                    {getPaymentMethodText(selectedOrder.payment.paymentMethod)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày thanh toán">
                    {dayjs(selectedOrder.payment.paymentDate).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tiền" span={2}>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedOrder.payment.amount)}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Summary */}
            <Card size="small">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Giảm giá:</span>
                  <span className="font-semibold">
                    - {formatCurrency(selectedOrder.discountAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Thành tiền:</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      selectedOrder.totalAmount -
                        (selectedOrder.discountAmount || 0)
                    )}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersList;
