import React, { useState } from "react";
import { Layout, Menu, Avatar, Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  Tag,
  UserCog,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { MENU_ITEMS } from "../../constants";

const { Sider } = Layout;

const iconMap = {
  BarChart3,
  ShoppingCart,
  Users,
  Package,
  Warehouse,
  Tag,
  UserCog,
  FileText,
};

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuth();

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent size={18} /> : null;
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const filteredMenuItems = MENU_ITEMS.filter((item) =>
    canAccess(item.roles)
  ).map((item) => ({
    key: item.key,
    icon: renderIcon(item.icon),
    label: item.label,
    onClick: () => handleMenuClick(item.path),
    children:
      "children" in item
        ? item.children?.map((child) => ({
            key: child.key,
            label: child.label,
            onClick: () => handleMenuClick(child.path),
          }))
        : undefined,
  }));

  const selectedKey =
    location.pathname === "/"
      ? "dashboard"
      : MENU_ITEMS.find((item) => location.pathname.startsWith(item.path))
          ?.key ||
        MENU_ITEMS.find(
          (item) =>
            "children" in item &&
            item.children?.some((child) => location.pathname === child.path)
        )?.key;

  return (
    <Sider
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="relative"
      width={260}
      collapsedWidth={80}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          {collapsed ? (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
          ) : (
            <div className="text-white font-bold text-lg">Retail System</div>
          )}
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="bg-blue-600">
                {user?.full_name.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {user?.full_name}
                </div>
                <div className="text-gray-400 text-xs capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={filteredMenuItems}
            className="border-none"
          />
        </div>

        {/* Collapse Button */}
        <div className="absolute -right-3 top-20 z-10">
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={
              collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />
            }
            onClick={() => setCollapsed(!collapsed)}
            className="shadow-lg"
          />
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
