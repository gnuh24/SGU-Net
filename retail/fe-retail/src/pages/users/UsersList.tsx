import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, message } from "antd";
import { userService } from "../../services/userService";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";

const UsersList: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ page: 1, pageSize: 1000 });
      setData(res.data || []);
    } catch (err: any) {
      message.error(err.message || "Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    navigate("/users/new");
  };

  const handleEdit = (record: User) => {
    navigate(`/users/${record.id}/edit`);
  };

  const handleDelete = async (record: User) => {
    Modal.confirm({
      title: "Xác nhận",
      content: `Bạn có muốn xóa người dùng ${record.username}?`,
      onOk: async () => {
        try {
          await userService.deleteUser(record.id);
          message.success("Xóa thành công");
          fetchUsers();
        } catch (err: any) {
          message.error(err.message || "Xóa thất bại");
        }
      },
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Full name", dataIndex: "full_name", key: "full_name" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Quản lý người dùng</h2>
        <Button type="primary" onClick={handleCreate}>
          Thêm người dùng
        </Button>
      </div>

      <Table
        rowKey={(r: any) => r.id}
        dataSource={data}
        columns={columns}
        loading={loading}
      />
    </div>
  );
};

export default UsersList;
