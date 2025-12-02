import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, Form, Input, message } from "antd";
import axios from "axios";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { da } from "date-fns/locale";

interface Category {
  categoryId: number;
  name: string;
}

const API_URL = "http://localhost:5260/api/v1/categories";

const CategoryList: React.FC = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.append("search", search);

      const res = await fetch(`${API_URL}?${params.toString()}`);
      const data =await res.json()
      const totalCount = data.total;
      let list: Category[] = [];
      list = data.data.data;
      if (Array.isArray(list)) {
        setCategories(list);
        console.log("Fetched categories:", data);
        setTotal(totalCount);
      } else {
        setCategories([]);
        console.log("Fetched find categories: []");
        setTotal(0);
      }
    } catch (error) {
      message.error("Không thể tải danh mục!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCategories(searchText);
    }, 500);
    return () => clearTimeout(timeout);
  }, [page, pageSize, searchText]);

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa danh mục này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await axios.delete(`${API_URL}/${id}`);
          message.success("Đã xóa thành công");
          fetchCategories(searchText);
        } catch {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const handleAddOrEdit = async () => {
    try {
      const values = await form.validateFields();

      if (values.categoryId) {
        await axios.put(`${API_URL}/${values.categoryId}`, values);
        message.success("Cập nhật thành công");
      } else {
        await axios.post(API_URL, values);
        message.success("Thêm mới thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchCategories(searchText);
    } catch {
      message.error("Lưu thất bại!");
    }
  };

  const columns = [
    { title: "Mã danh mục", dataIndex: "categoryId", key: "categoryId",sorter: (a: Category, b: Category) => a.categoryId - b.categoryId,
      defaultSortOrder: "ascend", },
    { title: "Tên danh mục", dataIndex: "name", key: "name" },
    {
  title: "Hành động",
  key: "action",
  render: (_: unknown, record: Category) => {
    
    if (record.categoryId === 1) {
      return null; 
    }

    return (
      <Space>
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            form.setFieldsValue(record);
            setIsModalOpen(true);
          }}
        />
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.categoryId)}
        />
      </Space>
    );
  },
},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Tìm danh mục (vd: Bánh kẹo)"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Button onClick={() => setSearchText("")}>Tải lại</Button>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Thêm danh mục
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="categoryId"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (t) => `Tổng ${t} danh mục`,
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
        title="Thêm / Sửa danh mục"
        open={isModalOpen}
        onOk={handleAddOrEdit}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input placeholder="VD: Bánh kẹo" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryList;
