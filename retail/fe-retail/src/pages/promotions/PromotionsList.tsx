import React, { useEffect, useState } from "react";
import { Table, Button, Space, Modal, message } from "antd";
import { promotionService } from "../../services/promotionService";
import { useNavigate } from "react-router-dom";

const PromotionsList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await promotionService.getPromotions();
      setData(res || []);
    } catch (err: any) {
      message.error(err.message || "Lỗi khi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
    const handler = () => fetchPromos();
    window.addEventListener("promotions:updated", handler as EventListener);
    return () =>
      window.removeEventListener(
        "promotions:updated",
        handler as EventListener
      );
  }, []);

  const handleCreate = () => {
    navigate("/promotions/new");
  };

  const handleEdit = (record: any) => {
    navigate(`/promotions/${record.id}/edit`);
  };

  const toggleStatus = async (record: any) => {
    const id = record.id;
    setRowLoading((s) => ({ ...s, [id]: true }));
    try {
      const newStatus = record.status === "active" ? "inactive" : "active";
      await promotionService.updatePromotion(id, { status: newStatus });
      message.success("Cập nhật trạng thái");
      fetchPromos();
    } catch (err: any) {
      message.error(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setRowLoading((s) => ({ ...s, [id]: false }));
    }
  };

  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: "Xác nhận",
      content: `Bạn có muốn xóa chương trình ${record.promo_code}?`,
      onOk: async () => {
        try {
          await promotionService.deletePromotion(record.id);
          message.success("Xóa thành công");
          fetchPromos();
        } catch (err: any) {
          message.error(err.message || "Xóa thất bại");
        }
      },
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Code", dataIndex: "promo_code", key: "promo_code" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Type",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (type: string) => {
        if (type === "percent" || type === "percentage") return "Giảm %";
        if (type === "fixed" || type === "fixed_amount") return "Giảm VNĐ";
        return type;
      },
    },
    {
      title: "Value",
      dataIndex: "discount_value",
      key: "discount_value",
      render: (value: number, record: any) => {
        const type = record.discount_type;
        if (type === "percent" || type === "percentage") {
          // Fix: Nếu value < 1 thì backend trả về dạng decimal (0.1 = 10%)
          let percentValue = value;
          if (percentValue > 0 && percentValue < 1) {
            percentValue = percentValue * 100;
          }
          return `${percentValue}%`;
        }
        return new Intl.NumberFormat("vi-VN").format(value) + " VNĐ";
      },
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: any, record: any) => {
        const now = new Date();
        const endDate = record.end_date ? new Date(record.end_date) : null;
        const startDate = record.start_date
          ? new Date(record.start_date)
          : null;

        // Kiểm tra hết hạn
        if (endDate && endDate < now) {
          return <span className="text-gray-500">Hết hạn</span>;
        }

        // Kiểm tra chưa bắt đầu
        if (startDate && startDate > now) {
          return <span className="text-blue-500">Chưa bắt đầu</span>;
        }

        // Kiểm tra trạng thái active/inactive
        const s = String(status);
        if (s === "active" || s === "true") {
          return <span className="text-green-500">Đang hoạt động</span>;
        } else {
          return <span className="text-red-500">Không hoạt động</span>;
        }
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button
            onClick={() => toggleStatus(record)}
            loading={!!rowLoading[record.id]}
          >
            {record.status === "active" ? "Deactivate" : "Activate"}
          </Button>
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
        <h2 className="text-lg font-semibold">Quản lý Khuyến mãi</h2>
        <div className="flex items-center gap-3">
          <Button type="primary" onClick={handleCreate}>
            Thêm khuyến mãi
          </Button>
          {import.meta.env.VITE_USE_MOCK_API === "true" && (
            <Button
              onClick={async () => {
                // reset mock promotions
                const mod = await import("../../services/mock/mockPromotions");
                mod.resetMockPromotions();
                fetchPromos();
                message.success("Mock promotions reset");
              }}
            >
              Reset Mock
            </Button>
          )}
        </div>
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

export default PromotionsList;
