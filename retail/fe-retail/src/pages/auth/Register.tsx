import React, { useState } from "react";
import { Form, Input, Button, Card, Alert, Select } from "antd";
import { User, Lock, UserPlus } from "lucide-react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch } from "../../hooks/redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { RegisterRequest } from "../../types";

const { Option } = Select;

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: RegisterRequest) => {
    setSubmitLoading(true);
    dispatch(loginStart());

    try {
      const response = await authService.register(values);
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.token,
        })
      );

      navigate("/dashboard");
    } catch (error: any) {
      dispatch(loginFailure(error.message || "Đăng ký thất bại"));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng ký tài khoản
            </h1>
            <p className="text-gray-600">Tạo tài khoản mới cho hệ thống</p>
          </div>

          {error && (
            <Alert
              message="Lỗi đăng ký"
              description={error}
              type="error"
              showIcon
              className="mb-6"
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
                { max: 50, message: "Tên đăng nhập không được quá 50 ký tự!" },
                {
                  pattern: /^\w+$/,
                  message:
                    "Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới!",
                },
              ]}
            >
              <Input
                prefix={<User size={18} className="text-gray-400" />}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="full_name"
              label="Họ và tên"
              rules={[
                { required: true, message: "Vui lòng nhập họ và tên!" },
                { max: 100, message: "Họ và tên không được quá 100 ký tự!" },
              ]}
            >
              <Input
                prefix={<User size={18} className="text-gray-400" />}
                placeholder="Nhập họ và tên đầy đủ"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password
                prefix={<Lock size={18} className="text-gray-400" />}
                placeholder="Nhập mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<Lock size={18} className="text-gray-400" />}
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item name="role" initialValue="staff" hidden>
              <Input type="hidden" value="staff" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12"
                loading={loading || submitLoading}
              >
                {loading || submitLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Đã có tài khoản? </span>
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
