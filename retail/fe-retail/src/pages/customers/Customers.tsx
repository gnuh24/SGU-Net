import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  message,
  Typography,
  Card,
  Descriptions,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";

// 🎯 SỬA LỖI: Cập nhật đường dẫn import ordersApi dựa trên cấu trúc file
// Từ 'src/pages/customers/Customers.tsx' đi ra 2 cấp (..) để vào 'src/api'
import { ordersApi } from "../../api/orderApi"; 

const { Title } = Typography;

// ⚙️ Interface khớp với BE .NET
interface Customer {
  customerId: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: string;
}

interface Order {
  orderId: number;
  totalAmount: number;
  status: string;
  orderDate: string;
}

const API_CUSTOMERS = "http://localhost:5260/api/v1/customers";
// const API_ORDERS = "http://localhost:5260/api/v1/orders"; // Không cần dùng API_ORDERS ở đây

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  // 🟢 Lấy danh sách khách hàng từ BE
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_CUSTOMERS);
      // Giữ nguyên cách trích xuất dữ liệu khách hàng
      const data = res.data.data?.data || []; 
      setCustomers(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🟢 Tìm kiếm theo tên hoặc SĐT
  useEffect(() => {
    if (!search) return setFiltered(customers);
    const s = search.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s)
      )
    );
  }, [search, customers]);

  // 🟢 Submit form Thêm / Cập nhật
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingCustomer) {
        await axios.put(`${API_CUSTOMERS}/${editingCustomer.customerId}`, values);
        message.success("Cập nhật khách hàng thành công!");
      } else {
        await axios.post(API_CUSTOMERS, values);
        message.success("Thêm khách hàng mới thành công!");
      }

      setOpenModal(false);
      form.resetFields();
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi lưu dữ liệu!");
    }
  };

  // 🗑️ Xóa khách hàng
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xóa khách hàng?",
      content: "Bạn có chắc muốn xóa khách hàng này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await axios.delete(`${API_CUSTOMERS}/${id}`);
          message.success("Đã xóa khách hàng!");
          fetchCustomers();
        } catch (err) {
          console.error(err);
          message.error("Xóa khách hàng thất bại!");
        }
      },
    });
  };

  // 🟢 Lấy danh sách đơn hàng khi mở modal chi tiết khách
  const fetchOrders = async (customerId: number) => {
    try {
      setOrdersLoading(true);
      
      // 🎯 SỬA LỖI: Gọi ordersApi để lấy dữ liệu đơn hàng
      // Hàm này đã được thiết lập để trả về trực tiếp mảng đơn hàng
      const data = await ordersApi.getByCustomerId(customerId);
      
      setOrders(Array.isArray(data) ? data : []); 
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách đơn hàng!");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const customerColumns: ColumnsType<Customer> = [
    { title: "Tên khách hàng", dataIndex: "name", key: "name" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setEditingCustomer(record);
              setOpenDetail(true);
              fetchOrders(record.customerId);
            }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCustomer(record);
              form.setFieldsValue(record);
              setOpenModal(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.customerId)}
          />
        </Space>
      ),
    },
  ];

  const orderColumns: ColumnsType<Order> = [
    { title: "Mã đơn hàng", dataIndex: "orderId", key: "orderId" },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value: number) => value?.toLocaleString("vi-VN") + " ₫",
    },
    { title: "Trạng thái", dataIndex: "status", key: "status" },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <div className="flex justify-between items-center">
            <Title level={4} className="!mb-0 text-[#1677ff]">
              Quản lý Khách hàng
            </Title>
            <div className="flex gap-2">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm theo tên hoặc SĐT..."
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields();
                  setEditingCustomer(null);
                  setOpenModal(true);
                }}
              >
                Thêm khách hàng
              </Button>
            </div>
          </div>
        }
        className="shadow-md rounded-xl"
      >
        <Table
          columns={customerColumns}
          dataSource={filtered}
          loading={loading}
          rowKey="customerId"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={openModal}
        title={editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
        okText="Lưu"
        cancelText="Hủy"
        onCancel={() => {
          setOpenModal(false);
          setEditingCustomer(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[{ required: true, message: "Nhập tên khách hàng!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Nhập số điện thoại!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        open={openDetail}
        title="Chi tiết khách hàng"
        footer={null}
        width={800}
        onCancel={() => {
            setOpenDetail(false);
            setOrders([]); // Xóa đơn hàng khi đóng modal
        }}
      >
        {editingCustomer ? (
          <>
            <Card title="Thông tin khách hàng" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Mã khách hàng">
                  {editingCustomer.customerId}
                </Descriptions.Item>
                <Descriptions.Item label="Tên khách hàng">
                  {editingCustomer.name}
                </Descriptions.Item>
                <Descriptions.Item label="Email">{editingCustomer.email}</Descriptions.Item>
                <Descriptions.Item label="SĐT">{editingCustomer.phone}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {editingCustomer.address}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={2}>
                  {editingCustomer.createdAt
                    ? new Date(editingCustomer.createdAt).toLocaleString()
                    : "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Danh sách đơn hàng đã mua">
              {ordersLoading ? (
                <Spin />
              ) : (
                <Table
                  dataSource={orders}
                  columns={orderColumns}
                  rowKey="orderId"
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'Chưa có đơn hàng nào.' }} 
                />
              )}
            </Card>
          </>
        ) : (
          <Spin />
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;
