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

  const handleToggleStatus = async (record: User) => {
    const isCurrentlyBanned = record.status === "banned";
    const action = isCurrentlyBanned ? "mở" : "khóa";
    const newStatus = isCurrentlyBanned ? "active" : "banned";

    Modal.confirm({
      title: "Xác nhận",
      content: `Bạn có muốn ${action} tài khoản của ${record.username}?`,
      onOk: async () => {
        try {
          await userService.updateUser(record.id, { status: newStatus });
          message.success(
            `${
              action.charAt(0).toUpperCase() + action.slice(1)
            } tài khoản thành công`
          );
          fetchUsers();
        } catch (err: any) {
          message.error(err.message || `Không thể ${action} tài khoản`);
        }
      },
    });
  };

  // const handleDelete = async (record: User) => {
  //   Modal.confirm({
  //     title: "Xác nhận",
  //     content: `Bạn có muốn xóa người dùng ${record.username}?`,
  //     onOk: async () => {
  //       try {
  //         await userService.deleteUser(record.id);
  //         message.success("Xóa thành công");
  //         fetchUsers();
  //       } catch (err: any) {
  //         message.error(err.message || "Xóa thất bại");
  //       }
  //     },
  //   });
  // };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "active":
        return { text: "Hoạt động", color: "green" };
      case "banned":
        return { text: "Đã khóa", color: "red" };
      case "inactive":
        return { text: "Không hoạt động", color: "orange" };
      default:
        return { text: "Hoạt động", color: "green" };
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Full name", dataIndex: "full_name", key: "full_name" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const { text, color } = getStatusText(status);
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: User) =>
        record.role === "admin" ? null : (
          <Space>
            <Button onClick={() => handleEdit(record)}>Sửa</Button>
            <Button
              type={record.status === "banned" ? "default" : "primary"}
              danger={record.status !== "banned"}
              onClick={() => handleToggleStatus(record)}
            >
              {record.status === "banned" ? "Mở khóa" : "Khóa"}
            </Button>
            {/* <Button danger onClick={() => handleDelete(record)}>
              Xóa
            </Button> */}
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
