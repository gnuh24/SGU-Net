import React, { useEffect } from "react";
import { Form, Input, Button, Select, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { userService } from "../../services/userService";
import { User } from "../../types";

const { Option } = Select;

const UserForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const user = await userService.getUserById(Number(id));
          form.setFieldsValue(user as any);
        } catch (err: any) {
          message.error(err.message || "Lỗi khi tải user");
        }
      })();
    }
  }, [id]);

  const onFinish = async (values: any) => {
    try {
      if (isEdit) {
        await userService.updateUser(Number(id), values);
        message.success("Cập nhật thành công");
      } else {
        await userService.createUser(values);
        message.success("Tạo thành công");
      }
      navigate("/users");
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {isEdit ? "Sửa người dùng" : "Thêm người dùng"}
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ role: "staff" }}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
        )}

        <Form.Item label="Full name" name="full_name">
          <Input />
        </Form.Item>

        <Form.Item label="Role" name="role" rules={[{ required: true }]}>
          <Select>
            <Option value="staff">Nhân viên</Option>
            <Option value="admin">Quản trị viên</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UserForm;
