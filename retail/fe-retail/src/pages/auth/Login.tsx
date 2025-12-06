import React, { useState } from "react";
import { Form, Input, Button, Card, Alert, Checkbox } from "antd";
import { User, Lock } from "lucide-react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAppDispatch } from "../../hooks/redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { LoginRequest } from "../../types";

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, user } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (user?.role === "admin") {
      return <Navigate to="/users" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: LoginRequest) => {
    dispatch(loginStart());

    try {
      const response = await authService.login(values);
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.token,
        })
      );

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      }

      // Redirect based on role
      if (response.user.role === "admin") {
        navigate("/users");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      dispatch(loginFailure(error.message || "Đăng nhập thất bại"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng nhập hệ thống
            </h1>
            <p className="text-gray-600">Hệ thống quản lý bán hàng</p>
          </div>

          {error && (
            <Alert
              message="Lỗi đăng nhập"
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
              ]}
            >
              <Input
                prefix={<User size={18} className="text-gray-400" />}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
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
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  Ghi nhớ đăng nhập
                </Checkbox>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12"
                loading={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Form.Item>
          </Form>

          {/* <div className="mt-6 text-center">
            <div className="mb-4">
              <span className="text-gray-600">Chưa có tài khoản? </span>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng ký ngay
              </Link>
            </div>
            <div className="text-sm text-gray-600">Tài khoản demo:</div>
            <div className="text-xs text-gray-500 mt-2">
              <div>Admin: admin / password</div>
              <div>Staff: staff / password</div>
            </div>
          </div> */}
        </Card>
      </div>
    </div>
  );
};

export default Login;
