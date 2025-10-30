import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Product {
  productId: number;
  categoryId: number;
  supplierId: number;
  productName: string;
  barcode: string;
  price: number;
  unit: string;
  createdAt: string;
  categoryName: string;
  supplierName: string;
  isDeleted: boolean;
  currentStock?: number;
}

interface Category {
  categoryId: number;
  name: string;
}

interface Supplier {
  supplierId: number;
  name: string;
}

const API_URL = "http://localhost:5260/api/v1/products";

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"active" | "deleted" | "all">("active");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    const res = await fetch("http://localhost:5260/api/v1/categories?pageSize=100");
    const data = await res.json();
    if (Array.isArray(data.data)) setCategories(data.data);
  };


  const fetchSuppliers = async () => {
    const res = await fetch("http://localhost:5260/api/v1/suppliers?pageSize=100");
    const data = await res.json();
    if (Array.isArray(data.data)) setSuppliers(data.data);
  };


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "9999" });
      if (searchText.trim()) params.append("search", searchText);
      if (categoryId && categoryId !== 0)
        params.append("categoryId", String(categoryId));
      if (supplierId && supplierId !== 0)
        params.append("supplierId", String(supplierId));

      if (status === "deleted") {
        params.append("isDeleted", "true");
      } else if (status === "active") {
        params.append("isDeleted", "false");
      }

      const res = await fetch(`${API_URL}?${params.toString()}`);

      const data = await res.json();

      let list: Product[] = [];
      if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.data?.data)) list = data.data.data;
      else if (Array.isArray(data.data?.items)) list = data.data.items;


      const filtered = list.filter((item) => {
        if (status === "active") return item.isDeleted === false;
        if (status === "deleted") return item.isDeleted === true;
        return true;
      });

      const sorted = filtered.sort((a, b) => a.productId - b.productId);
      setProducts(sorted);
      setTotal(sorted.length);
    } catch (error) {
      message.error("Không thể tải sản phẩm!");
      console.error("❌ Lỗi fetchProducts:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchText, categoryId, supplierId, status]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name,
        barcode: values.barcode || "",
        price: Number(values.price) || 0,
        unit: values.unit || "",
        categoryId: Number(values.categoryId),
        supplierId: Number(values.supplierId),
        isDeleted: false,
      };

      console.log("Payload gửi đi:", payload);

      if (editingProduct) {

        const res = await fetch(`${API_URL}/${editingProduct.productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.status === 200) {
          message.success("Cập nhật sản phẩm thành công!");
        } else {
          message.error(data.message || "Lỗi khi cập nhật!");
        }
      } else {

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.status === 200) {
          message.success("Thêm sản phẩm thành công!");
        } else {
          message.error(data.message || "Lỗi khi thêm sản phẩm!");
        }
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      console.error("❌ Lỗi khi lưu sản phẩm:", error);
      message.error("Lưu thất bại!");
    }
  };



  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa sản phẩm?",
      content: "Bạn có chắc chắn muốn xóa sản phẩm này không?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          message.success("Đã xóa thành công!");
          fetchProducts();
        } catch (error) {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const columns = [
    { title: "Mã SP", dataIndex: "productId", key: "productId" },
    { title: "Tên sản phẩm", dataIndex: "productName", key: "productName" },
    { title: "Barcode", dataIndex: "barcode", key: "barcode" },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (v: number) => v.toLocaleString("vi-VN") + " ₫",
    },
    { title: "Đơn vị", dataIndex: "unit", key: "unit" },
    { title: "Danh mục", dataIndex: "categoryName", key: "categoryName" },
    { title: "Nhà cung cấp", dataIndex: "supplierName", key: "supplierName" },
    { title: "Tồn kho", dataIndex: "currentStock", key: "currentStock" },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "isDeleted",
      key: "isDeleted",
      render: (v: boolean) =>
        v ? (
          <span style={{ color: "red" }}>Đã xóa</span>
        ) : (
          <span style={{ color: "green" }}>Hoạt động</span>
        ),
    },

    {
      title: "Hành động",
      key: "action",
      render: (_: unknown, record: Product) => (
        <Space>
          {!record.isDeleted && (
            <Button
              icon={<EditOutlined />}
              type="link"
              onClick={() => {
                setEditingProduct(record);
                form.setFieldsValue({
                  ...record,
                  name: record.productName,
                });
                setIsModalOpen(true);
              }}
            >
              Sửa
            </Button>
          )}
          {!record.isDeleted && (
            <Button
              danger
              icon={<DeleteOutlined />}
              type="link"
              onClick={() => handleDelete(record.productId)}
            >
              Xóa
            </Button>
          )}
        </Space>
      ),
    },

  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Quản lý sản phẩm
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Thêm sản phẩm
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên sản phẩm..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 250 }}
        />

        <Select
          value={categoryId ?? 0}
          onChange={(val) => setCategoryId(val === 0 ? null : val)}
          options={[
            { value: 0, label: "Tất cả danh mục" },
            ...categories.map((c) => ({
              value: c.categoryId,
              label: c.name,
            })),
          ]}
          style={{ width: 180 }}
        />

        <Select
          value={supplierId ?? 0}
          onChange={(val) => setSupplierId(val === 0 ? null : val)}
          options={[
            { value: 0, label: "Tất cả nhà cung cấp" },
            ...suppliers.map((s) => ({
              value: s.supplierId,
              label: s.name,
            })),
          ]}
          style={{ width: 180 }}
        />
        <Select
          value={status}
          onChange={(val) => setStatus(val)}
          options={[

            { value: "active", label: "Còn hoạt động" },
            { value: "deleted", label: "Đã xóa" },
          ]}
          style={{ width: 180 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={products.slice((page - 1) * pageSize, page * pageSize)}
        rowKey="productId"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showTotal: (t) => `Tổng ${t} sản phẩm`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />


      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên sản phẩm"
            name="name" // ✅ đổi từ productName -> name
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Barcode" name="barcode">
            <Input />
          </Form.Item>

          <Form.Item
            label="Giá"
            name="price"
            rules={[{ required: true, message: "Nhập giá sản phẩm" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item label="Đơn vị" name="unit">
            <Input />
          </Form.Item>

          <Form.Item
            label="Danh mục"
            name="categoryId"
            rules={[{ required: true, message: "Chọn danh mục" }]}
          >
            <Select
              options={categories.map((c) => ({
                value: c.categoryId,
                label: c.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Nhà cung cấp"
            name="supplierId"
            rules={[{ required: true, message: "Chọn nhà cung cấp" }]}
          >
            <Select
              options={suppliers.map((s) => ({
                value: s.supplierId,
                label: s.name,
              }))}
            />
          </Form.Item>
        </Form>

      </Modal>
    </div>
  );
};

export default ProductList;
