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
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Inventory { /* giữ nguyên */ }
interface Category { /* giữ nguyên */ }
interface Supplier { /* giữ nguyên */ }
interface Product {
  productId: number;
  productName: string;
}

const InventoryList: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // filter
  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  // Modal nhập hàng
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch danh mục, nhà cung cấp, kho
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5260/api/v1/categories?pageSize=100");
      const data = await res.json();
      if (Array.isArray(data.data)) setCategories(data.data);
    } catch (error) { console.error(error); }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("http://localhost:5260/api/v1/suppliers?pageSize=100");
      const data = await res.json();
      if (Array.isArray(data.data)) setSuppliers(data.data);
    } catch (error) { console.error(error); }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({ pageSize: "9999", isDeleted: "false" });
      const res = await fetch("http://localhost:5260/api/v1/products?" + params.toString());
      const data = await res.json();

      let list: Product[] = [];
      if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.data?.data)) list = data.data.data;
      else if (Array.isArray(data.data?.items)) list = data.data.items;

      // Map chỉ lấy productId và productName
      const productOptions = list.map(p => ({
        productId: p.productId,
        productName: p.productName,
      }));
      setProducts(productOptions);
    } catch (error) {
      console.error("Lỗi fetchProducts:", error);
    }
  };


  const fetchInventories = async () => {
    try {
      const params = new URLSearchParams({ desc: String(desc), pageSize: "9999" });
      if (searchText.trim()) params.append("search", searchText);
      if (categoryId && categoryId !== 0) params.append("categoryId", String(categoryId));
      if (supplierId && supplierId !== 0) params.append("supplierId", String(supplierId));

      const res = await fetch(`http://localhost:5260/api/v1/inventories?${params.toString()}`);
      const data = await res.json();
      const list = Array.isArray(data.data?.data) ? data.data.data : Array.isArray(data.data) ? data.data : [];
      const sorted = [...list].sort((a, b) => a.inventoryId - b.inventoryId);
      setInventories(sorted);
      setTotal(sorted.length);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchProducts();
  }, []);

  useEffect(() => { fetchInventories(); }, [searchText, categoryId, supplierId, desc]);

  // Gửi POST nhập hàng
  const handleAddQuantity = async () => {
    try {
      const values = await form.validateFields();
      await fetch("http://localhost:5260/api/v1/inventories/add-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: values.productId,
          quantity: values.quantity,
        }),
      });
      message.success("Nhập hàng thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchInventories();
    } catch (error) {
      console.error(error);
      message.error("Nhập hàng thất bại!");
    }
  };

  const columns = [
    { title: "Mã kho", dataIndex: "inventoryId", key: "inventoryId" },
    { title: "Tên sản phẩm", dataIndex: "productName", key: "productName" },
    { title: "Barcode", dataIndex: "barcode", key: "barcode" },
    { title: "Giá", dataIndex: "price", key: "price", render: (v: number) => v.toLocaleString("vi-VN") + " ₫" },
    { title: "Đơn vị", dataIndex: "unit", key: "unit" },
    { title: "Danh mục", dataIndex: "categoryName", key: "categoryName" },
    { title: "Nhà cung cấp", dataIndex: "supplierName", key: "supplierName" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity", render: (q: number) => <b>{q}</b> },
    { title: "Cập nhật", dataIndex: "updatedAt", key: "updatedAt", render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm") },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Quản lý kho hàng</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Nhập hàng
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
          options={[{ value: 0, label: "Tất cả danh mục" }, ...categories.map(c => ({ value: c.categoryId, label: c.name }))]}
          style={{ width: 180 }}
        />
        <Select
          value={supplierId ?? 0}
          onChange={(val) => setSupplierId(val === 0 ? null : val)}
          options={[{ value: 0, label: "Tất cả nhà cung cấp" }, ...suppliers.map(s => ({ value: s.supplierId, label: s.name }))]}
          style={{ width: 180 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={inventories.slice((page - 1) * pageSize, page * pageSize)}
        rowKey="inventoryId"
        bordered
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      {/* Modal nhập hàng */}
      <Modal
        title="Nhập hàng"
        open={isModalOpen}
        onOk={handleAddQuantity}
        onCancel={() => setIsModalOpen(false)}
        okText="Nhập"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: "Chọn sản phẩm" }]}
          >
            <Select
              options={products.map(p => ({ value: p.productId, label: p.productName }))}
              placeholder="Chọn sản phẩm"
            />
          </Form.Item>
          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryList;
