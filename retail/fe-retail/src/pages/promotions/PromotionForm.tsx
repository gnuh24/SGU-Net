import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { promotionService } from "../../services/promotionService";

const { Option } = Select;

const PromotionForm: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          const res = await promotionService.getPromotionById(Number(id));
          // Map status (string) to boolean for the Select field
          const mapped = { ...res };
          if (mapped.status === "active") mapped.status = true;
          else if (mapped.status === "inactive") mapped.status = false;

          // Map start_date/end_date to date_range (dayjs)
          if (mapped.start_date || mapped.end_date) {
            mapped.date_range = [
              mapped.start_date ? dayjs(mapped.start_date) : null,
              mapped.end_date ? dayjs(mapped.end_date) : null,
            ];
          }

          form.setFieldsValue(mapped);
        } catch (err: any) {
          message.error(err.message || "Lỗi khi tải khuyến mãi");
        }
      })();
    }
  }, [id]);

  const onFinish = async (values: any) => {
    try {
      // Normalize status to string values expected by backend/mock
      if (values.status === true) values.status = "active";
      if (values.status === false) values.status = "inactive";

      // If date_range provided (RangePicker), convert to ISO start_date/end_date
      if (values.date_range && Array.isArray(values.date_range)) {
        const [start, end] = values.date_range;
        values.start_date = start ? start.toISOString() : undefined;
        values.end_date = end ? end.toISOString() : undefined;
        delete values.date_range;
      }

      if (isEdit) {
        await promotionService.updatePromotion(Number(id), values);
        message.success("Cập nhật thành công");
      } else {
        await promotionService.createPromotion(values);
        message.success("Tạo thành công");
      }
      // Notify list page to refresh
      try {
        window.dispatchEvent(new CustomEvent("promotions:updated"));
      } catch (err) {
        // In case CustomEvent isn't available (very old browsers), skip silently but log in dev
        // eslint-disable-next-line no-console
        console.debug("promotions event dispatch failed:", err);
      }
      navigate("/promotions");
    } catch (err: any) {
      message.error(err.message || "Lỗi");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {isEdit ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
      </h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Promo code"
          name="promo_code"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input />
        </Form.Item>

        <Form.Item
          label="Discount type"
          name="discount_type"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="percent">%</Option>
            <Option value="fixed">Fixed</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Discount value"
          name="discount_value"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Min order amount" name="min_order_amount">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Usage limit" name="usage_limit">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Start - End" name="date_range">
          <DatePicker.RangePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Status" name="status" initialValue={true}>
          <Select>
            <Option value={true}>Active</Option>
            <Option value={false}>Inactive</Option>
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

export default PromotionForm;
