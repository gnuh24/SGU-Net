import React from "react";
import { Layout, Avatar, Dropdown, Button } from "antd";
import { LogOut, Settings, User, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux";
import { logout } from "../../store/slices/authSlice";
import { authService } from "../../services/authService";

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      dispatch(logout());
      navigate("/login");
    }
  };

  const dropdownItems = [
    {
      key: "profile",
      label: (
        <div className="flex items-center space-x-2">
          <User size={16} />
          <span>Thông tin cá nhân</span>
        </div>
      ),
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      label: (
        <div className="flex items-center space-x-2">
          <Settings size={16} />
          <span>Cài đặt</span>
        </div>
      ),
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: (
        <div className="flex items-center space-x-2 text-red-600">
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </div>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="bg-white shadow-sm border-b px-6 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-800 m-0">
          Hệ thống quản lý bán hàng
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button
          type="text"
          shape="circle"
          icon={<Bell size={18} />}
          className="flex items-center justify-center"
        />

        {/* User Menu */}
        <Dropdown
          menu={{ items: dropdownItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
            <Avatar className="bg-blue-600">
              {user?.full_name.charAt(0).toUpperCase()}
            </Avatar>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.full_name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
