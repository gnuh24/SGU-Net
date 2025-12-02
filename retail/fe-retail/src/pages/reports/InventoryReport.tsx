import React, { useEffect, useState } from "react";
import { Card, Table, message, Tag } from "antd";
import { apiService } from "../../services/apiService";

const InventoryReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const unwrapResponse = (response: any): any => {
    if (response?.data) return response.data;
    return response;
  };

  const fetchData = async (page: number = 1, pageSize: number = 20) => {
    setLoading(true);
    try {
      const response = await apiService.get("/inventories", {
        params: { page, pageSize },
      });

      const result = unwrapResponse(response);
      const items = result.items || result.data || [];
      const total = result.total || items.length;

      setData(items);
      setPagination({ current: page, pageSize, total });
    } catch (err: any) {
      console.error("Error fetching inventory report:", err);
      message.error(err.message || "Lỗi khi tải báo cáo tồn kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (paginationConfig: any) => {
    fetchData(paginationConfig.current, paginationConfig.pageSize);
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return <Tag color="red">Hết hàng</Tag>;
    } else if (currentStock <= minStock) {
      return <Tag color="orange">Sắp hết</Tag>;
    } else if (currentStock <= minStock * 2) {
      return <Tag color="blue">Cảnh báo</Tag>;
    } else {
      return <Tag color="green">Đủ hàng</Tag>;
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text: string, record: any) =>
        record.productName || record.product_name || text || "N/A",
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text: string, record: any) =>
        record.categoryName || record.category_name || text || "N/A",
    },
    {
      title: "Tồn kho hiện tại",
      dataIndex: "currentStock",
      key: "currentStock",
      align: "right" as const,
      render: (text: any, record: any) =>
        (
          record.currentStock ||
          record.current_stock ||
          record.quantity ||
          0
        ).toLocaleString(),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: any) => {
        const currentStock =
          record.currentStock || record.current_stock || record.quantity || 0;
        const minStock =
          record.minStock || record.min_stock || record.threshold || 0;
        return getStockStatus(currentStock, minStock);
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: 24 }}>
        📦 Báo cáo tồn kho
      </h2>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey={(record) =>
            record.inventoryId ||
            record.inventory_id ||
            record.productId ||
            record.id
          }
          locale={{ emptyText: "Chưa có dữ liệu" }}
        />
      </Card>
    </div>
  );
};

export default InventoryReport;
