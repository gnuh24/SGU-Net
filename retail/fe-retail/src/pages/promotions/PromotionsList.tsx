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
    { title: "Type", dataIndex: "discount_type", key: "discount_type" },
    { title: "Value", dataIndex: "discount_value", key: "discount_value" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: any) => {
        const s = String(status);
        const label = s === "active" || s === "true" ? "Active" : "Inactive";
        return (
          <span
            className={
              s === "active" || s === "true" ? "text-green-500" : "text-red-500"
            }
          >
            {label}
          </span>
        );
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
