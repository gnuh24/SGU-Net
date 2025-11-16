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
  Upload,
  Image,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { getImageUrl } from "../../utils/imageUtils";

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
  image?: string;
  imageUrl?: string;
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

// Hàm tạo barcode tự động: lấy barcode lớn nhất + 1
const generateBarcode = (products: Product[]): string => {
  const prefix = "890";
  
  // Lọc các barcode hợp lệ (bắt đầu bằng 890 và có 13 ký tự)
  const validBarcodes = products
    .filter(p => p.barcode && p.barcode.startsWith("890") && p.barcode.length === 13)
    .map(p => p.barcode!);
  
  if (validBarcodes.length === 0) {
    // Nếu không có barcode nào, bắt đầu từ 8900000000001
    return "8900000000001";
  }
  
  // Tìm barcode lớn nhất (chuyển phần số sau 890 thành số để so sánh)
  const maxBarcode = validBarcodes.reduce((max, current) => {
    const maxNum = parseInt(max.substring(3), 10);
    const currentNum = parseInt(current.substring(3), 10);
    return currentNum > maxNum ? current : max;
  });
  
  // Lấy phần số sau 890, +1, và format lại
  const maxNum = parseInt(maxBarcode.substring(3), 10);
  const nextNum = maxNum + 1;
  const nextDigits = nextNum.toString().padStart(10, "0");
  
  // Kiểm tra không vượt quá giới hạn (8909999999999)
  if (nextNum > 9999999999) {
    // Nếu vượt quá, tìm khoảng trống hoặc bắt đầu lại
    return "8900000000001";
  }
  
  return prefix + nextDigits;
};

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
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // Reset preview và fileList khi modal đóng
  useEffect(() => {
    if (!isModalOpen) {
      setFileList([]);
      setImagePreview(null);
    }
  }, [isModalOpen]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("barcode", values.barcode || "");
      formData.append("price", String(Number(values.price) || 0));
      formData.append("unit", values.unit || "");
      formData.append("categoryId", String(Number(values.categoryId)));
      formData.append("supplierId", String(Number(values.supplierId)));
      formData.append("isDeleted", "false");

      // Thêm file ảnh nếu có
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0] as any;
        if (file) {
          formData.append("imageFile", file);
          console.log("✅ Gửi ảnh mới:", file.name, file.size);
        } else {
          console.warn("⚠️ File không có originFileObj:", fileList[0]);
        }
      } else {
        console.log("ℹ️ Không có ảnh mới để upload");
      }

      if (editingProduct) {
        const res = await fetch(`${API_URL}/${editingProduct.productId}`, {
          method: "PUT",
          body: formData,
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
          body: formData,
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
      setFileList([]);
      setImagePreview(null);
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
    {
      title: "Ảnh",
      key: "image",
      width: 100,
      render: (_: unknown, record: Product) => {
        const imageUrl = getImageUrl(record.imageUrl, record.image);
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={record.productName}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={false}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: "#f0f0f0", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
            No Image
          </div>
        );
      },
    },
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
                // Set image preview nếu có - phải set trước khi mở modal
                const imgUrl = getImageUrl(record.imageUrl, record.image);
                if (imgUrl) {
                  // Set preview ngay lập tức
                  setImagePreview(imgUrl);
                  setFileList([]); // Clear fileList để hiển thị preview
                } else {
                  setImagePreview(null);
                  setFileList([]);
                }
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
            const newBarcode = generateBarcode(products);
            form.resetFields();
            form.setFieldsValue({ barcode: newBarcode });
            setFileList([]);
            setImagePreview(null);
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
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên sản phẩm"
            name="name"
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item 
            label="Barcode" 
            name="barcode"
            tooltip="Barcode tự động được tạo. Bạn có thể thay đổi nếu cần."
            rules={[
              { required: true, message: "Barcode là bắt buộc" },
              { 
                pattern: /^890\d{10}$/, 
                message: "Barcode phải có dạng 890XXXXXXXXXX (13 chữ số)" 
              },
              {
                validator: async (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  // Kiểm tra trùng barcode (chỉ khi edit)
                  if (editingProduct) {
                    const duplicate = products.find(
                      p => p.barcode === value && p.productId !== editingProduct.productId
                    );
                    if (duplicate) {
                      return Promise.reject(new Error(`Barcode "${value}" đã tồn tại cho sản phẩm "${duplicate.productName}"`));
                    }
                  } else {
                    // Kiểm tra trùng khi tạo mới
                    const duplicate = products.find(p => p.barcode === value);
                    if (duplicate) {
                      return Promise.reject(new Error(`Barcode "${value}" đã tồn tại cho sản phẩm "${duplicate.productName}"`));
                    }
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              placeholder="890XXXXXXXXXX"
              suffix={
                !editingProduct && (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => {
                      const newBarcode = generateBarcode(products);
                      form.setFieldsValue({ barcode: newBarcode });
                    }}
                    style={{ padding: 0, height: 'auto' }}
                  >
                    Tạo mới
                  </Button>
                )
              }
            />
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

          <Form.Item label="Ảnh sản phẩm" name="image">
            <div>
              {/* Hiển thị ảnh hiện tại nếu có (khi edit và chưa upload ảnh mới) */}
              {imagePreview && fileList.length === 0 && editingProduct && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                    Ảnh hiện tại:
                  </div>
                  <Image
                    src={imagePreview}
                    alt="Current image"
                    width={100}
                    height={100}
                    style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #d9d9d9" }}
                    preview={false}
                    onError={() => {
                      console.error("Failed to load preview image:", imagePreview);
                      setImagePreview(null);
                    }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
                    Upload ảnh mới bên dưới để thay thế
                  </div>
                </div>
              )}
              
              {/* Upload component - luôn hiển thị */}
              <Upload
                listType="picture-card"
                fileList={fileList}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error("Chỉ được upload file ảnh!");
                    return false;
                  }
                  const isLt5M = file.size / 1024 / 1024 < 5;
                  if (!isLt5M) {
                    message.error("Ảnh phải nhỏ hơn 5MB!");
                    return false;
                  }
                // Tạo UploadFile object với originFileObj
                const uploadFile: UploadFile = {
                  uid: `${Date.now()}`,
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                } as UploadFile;
                
                setFileList([uploadFile]);
                console.log("✅ File đã được thêm vào fileList:", file.name, file.size);
                
                // Clear preview ảnh cũ khi upload ảnh mới
                if (editingProduct) {
                  setImagePreview(null);
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                  // Set preview cho ảnh mới
                  setImagePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
                return false; // Prevent auto upload
                }}
                onRemove={() => {
                  setFileList([]);
                  // Nếu đang edit, khôi phục preview ảnh cũ
                  if (editingProduct && editingProduct.imageUrl) {
                    const imgUrl = getImageUrl(editingProduct.imageUrl, editingProduct.image);
                    setImagePreview(imgUrl);
                  } else {
                    setImagePreview(null);
                  }
                  return true;
                }}
                maxCount={1}
              >
                {fileList.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>
                      {editingProduct && imagePreview ? "Thay đổi ảnh" : "Upload"}
                    </div>
                  </div>
                )}
              </Upload>
              
              {/* Hiển thị preview ảnh mới khi upload */}
              {imagePreview && fileList.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                    Ảnh mới:
                  </div>
                  <Image
                    src={imagePreview}
                    alt="New image preview"
                    width={100}
                    height={100}
                    style={{ objectFit: "cover", borderRadius: 4, border: "1px solid #52c41a" }}
                    preview={false}
                  />
                </div>
              )}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductList;
