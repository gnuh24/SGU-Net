import React, { useEffect, useState } from "react";
import { Card, Row, Col, Table, message } from "antd";
import { reportService } from "../../services/reportService";

const ReportsDashboard: React.FC = () => {
  const [revenue, setRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const r1 = await reportService.getRevenue("month");
        const r2 = await reportService.getTopProducts();
        setRevenue(r1 || []);
        setTopProducts(r2 || []);
      } catch (err: any) {
        message.error(err.message || "Lỗi khi tải báo cáo");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Báo cáo & Thống kê</h2>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Doanh thu (this month)" loading={loading}>
            <Table
              dataSource={revenue}
              columns={[
                { title: "Ngày", dataIndex: "date", key: "date" },
                { title: "Total", dataIndex: "total", key: "total" },
              ]}
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Sản phẩm bán chạy" loading={loading}>
            <Table
              dataSource={topProducts}
              columns={[
                {
                  title: "Product",
                  dataIndex: "product_name",
                  key: "product_name",
                },
                { title: "Quantity", dataIndex: "quantity", key: "quantity" },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsDashboard;
