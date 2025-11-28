import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

interface Supplier {
  supplierId: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

const API_URL = "http://localhost:5260/api/v1/suppliers";

const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSuppliers();
  }, [page, pageSize]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const data =await res.json();
      const totalCount = data.total;
      let list: Supplier[] = [];
      list = data.data.data;
      console.log("Fetched suppliers:", list);
      if (Array.isArray(list)) {
        setSuppliers(list);
        setTotal(totalCount);
        console.log("array :", list);
      } else {
        setSuppliers([]);
        setTotal(0);
        console.log("kh array :",list);
      }
    } catch (err) {
      console.error("Lỗi khi fetch suppliers:", err);
      message.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Supplier) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xoá",
      content: `Bạn có chắc muốn xoá nhà cung cấp ${id}?`,
      okText: "Xoá",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${id}`);
          message.success("Đã xoá thành công");
          fetchSuppliers();
        } catch (error) {
          message.error("Xoá thất bại!");
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingSupplier) {
        await axios.put(`${API_URL}/${editingSupplier.supplierId}`, values);
        message.success("Cập nhật thành công");
      } else {
        await axios.post(API_URL, values);
        message.success("Thêm mới thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      message.error("Lưu thất bại!");
    }
  };

  const columns = [
    {
      title: "Mã NCC",
      dataIndex: "supplierId",
      key: "supplierId",
      sorter: (a: Supplier, b: Supplier) => a.supplierId - b.supplierId,
      defaultSortOrder: "ascend",
    },
    { title: "Tên nhà cung cấp", dataIndex: "name", key: "name" },
    { title: "Địa chỉ", dataIndex: "address", key: "address" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Hành động",
      key: "action",
      render: (_: unknown, record: Supplier) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.supplierId)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Danh sách nhà cung cấp
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm nhà cung cấp
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="supplierId"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (t) => `Tổng ${t} nhà cung cấp`,
          onChange: (p, ps) => {
            setPage(p);
            if (ps !== pageSize) {
              setPageSize(ps);
              setPage(1);
            }
          },
        }}
      />

      <Modal
        title={
          editingSupplier ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp mới"
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên nhà cung cấp"
            name="name"
            rules={[{ required: true, message: "Nhập tên nhà cung cấp" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierList;
