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
import { useSearchParams, useLocation } from "react-router-dom";
import { apiService } from "../../services/apiService";
import { getImageUrl } from "../../utils/imageUtils";
import dayjs from "dayjs";
import { useAuth } from "../../hooks/useAuth";

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
  promoCode?: string; // ✅ Đổi từ promoName thành promoCode để match API
  orderItems?: OrderItem[];
  payment?: Payment;
}

interface OrderItem {
  orderItemId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

interface Payment {
  paymentId: number;
  paymentMethod: string;
  amount: number;
  paymentDate: string;
}

const ORDERS_API_URL = "/orders";

interface OrderUpdateForm {
  userId?: number | null;
  promoId?: number | null;
  status?: string | null;
  paymentMethod?: string | null;
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
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user, hasRole } = useAuth();

  // Fetch lần đầu
  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự động lọc lại khi bộ lọc thay đổi (search, status, ngày)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders(1, pagination.pageSize);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Auto-refresh when coming from payment return page
  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      // Remove refresh param from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("refresh");
      setSearchParams(newSearchParams, { replace: true });
      // Refresh orders with current pagination
      fetchOrders(pagination.current || 1, pagination.pageSize || 10);
      message.success("Đã cập nhật danh sách hóa đơn", 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const unwrapResponse = (response: any): any => {
    // If response.data has pagination structure (data + total), return the whole object
    if (response?.data?.data && response?.data?.total !== undefined) {
      return response.data;
    }
    // Otherwise, unwrap to just the data
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  const fetchOrders = async (
    page: number = 1,
    pageSize: number = 10,
    customSortField?: string,
    customSortOrder?: string
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };

      // Staff chỉ xem hóa đơn của chính mình
      if (user && hasRole("staff")) {
        params.userId = user.id;
      }

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const activeSortField =
        customSortField !== undefined ? customSortField : sortField;
      const activeSortOrder =
        customSortOrder !== undefined ? customSortOrder : sortOrder;

      if (activeSortField) {
        // Map frontend field names to backend field names
        const fieldMapping: { [key: string]: string } = {
          orderId: "orderId",
          orderDate: "orderDate",
          finalAmount: "finalAmount",
        };
        params.sortBy = fieldMapping[activeSortField] || activeSortField;
      }
      if (activeSortOrder) params.sortDirection = activeSortOrder;

      const response = await apiService.get("/orders", { params });
      const data = unwrapResponse(response);

      // Backend returns PagedResponse structure: { data: [...], total: X, page: Y, pageSize: Z }
      if (
        data &&
        typeof data === "object" &&
        "data" in data &&
        "total" in data
      ) {
        setOrders(data.data || []);
        setPagination({ current: page, pageSize, total: data.total || 0 });
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        setOrders(data);
        setPagination({ current: page, pageSize, total: data.length });
      } else {
        setOrders([]);
        setPagination({ current: page, pageSize, total: 0 });
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
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

  const handleTableChange = (
    paginationConfig: any,
    filters: any,
    sorter: any
  ) => {
    // Handle sorting
    let newSortField = "";
    let newSortOrder = "";

    if (sorter.field) {
      newSortField = sorter.field;
      newSortOrder =
        sorter.order === "ascend"
          ? "asc"
          : sorter.order === "descend"
          ? "desc"
          : "";
      setSortField(newSortField);
      setSortOrder(newSortOrder);
    } else {
      setSortField("");
      setSortOrder("");
    }

    fetchOrders(
      paginationConfig.current,
      paginationConfig.pageSize,
      newSortField,
      newSortOrder
    );
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "orange";
      case "canceled":
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
      case "canceled":
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

  const cancelOrder = (orderId: number) => {
    Modal.confirm({
      title: "Xác nhận hủy đơn",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này?",
      okText: "Hủy đơn",
      cancelText: "Không",
      okButtonProps: { danger: true },

      onOk: async () => {
        try {
          await apiService.patch<boolean>(
            `/orders/update/${orderId}`,
            {
              status: "canceled",
            } as OrderUpdateForm
          );

          message.success("Hủy đơn hàng thành công");
          fetchOrders(); // reload list
        } catch (error: any) {
          message.error(error.message);
        }
      },
    });
  };

  const payOrder = async (orderId: number) => {
    try {
      await apiService.patch<boolean>(
        `/orders/update/${orderId}`,
        {
          status: "paid",
        } as OrderUpdateForm
      );

      message.success("Thanh toán thành công");
      fetchOrders();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Mã HĐ",
      dataIndex: "orderId",
      key: "orderId",
      width: 80,
      sorter: true,
      sortOrder:
        sortField === "orderId"
          ? sortOrder === "asc"
            ? ("ascend" as const)
            : ("descend" as const)
          : undefined,
      render: (id: number) => `#${id}`,
    },
    {
      title: "Ngày tạo",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 150,
      sorter: true,
      sortOrder:
        sortField === "orderDate"
          ? sortOrder === "asc"
            ? ("ascend" as const)
            : ("descend" as const)
          : undefined,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 130,
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
      dataIndex: "finalAmount",
      key: "finalAmount",
      align: "right" as const,
      width: 130,
      sorter: true,
      sortOrder:
        sortField === "finalAmount"
          ? sortOrder === "asc"
            ? ("ascend" as const)
            : ("descend" as const)
          : undefined,
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
      width: 130,
      render: (name: string) => name || "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: Order) => {
        const isLocked =
          record.status === "paid" || record.status === "canceled";
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => fetchOrderDetail(record.orderId)}
            >
              Xem
            </Button>
            <Button
              danger
              disabled={isLocked}
              onClick={() => cancelOrder(record.orderId)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={isLocked}
              onClick={() => payOrder(record.orderId)}
            >
              Pay
            </Button>
          </Space>
        );
      },
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
                <Option value="canceled">Đã hủy</Option>
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
                  {selectedOrder.promoCode || "Không có"}
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
                    key: "product",
                    width: 250,
                    render: (_: any, record: OrderItem) => (
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            getImageUrl(undefined, record.productImage) ||
                            "/placeholder-product.png"
                          }
                          alt={record.productName}
                          className="w-10 h-10 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-product.png";
                          }}
                        />
                        <span className="font-medium">
                          {record.productName}
                        </span>
                      </div>
                    ),
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
