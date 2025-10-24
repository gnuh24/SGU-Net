import React, { useEffect, useState, useMemo } from "react";
import {
  message as staticMessage,
  App,
  Spin,
  Card,
  Input,
  Button,
  Row,
  Col,
  Table,
  Typography,
  Select,
  InputNumber,
  Divider,
  Statistic,
  Modal,
  Form,
  Space,
} from "antd";
import {
  DeleteOutlined,
  UserOutlined,
  TagOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  posApi,
  SwaggerProduct,
  Customer,
  CartItem,
  Order,
  Promotion,
} from "@/api/posApi";
import { useAuth } from "@/hooks/useAuth";

const formatCurrency = (value: string | number | bigint) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numValue);
};

const { Title, Text } = Typography;
const { Option } = Select;

// Component chính
const PosPageInternal: React.FC = () => {
  const { user } = useAuth();
  const { message } = App.useApp();
  const [productQuery, setProductQuery] = useState("");
  const [allProducts, setAllProducts] = useState<SwaggerProduct[]>([]);
  const [productsFound, setProductsFound] = useState<SwaggerProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(
    null
  );
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingCustomers(true);
      setLoadingProducts(true);
      try {
        const customerData = await posApi.getCustomers();
        const productData = await posApi.getAllProducts();

        setCustomers(
          Array.isArray(customerData)
            ? customerData.map((c) => ({
                ...c,
                customerId: c.customerId ?? c.id!,
                customerName: c.customerName ?? c.name!,
                phoneNumber: c.phoneNumber ?? c.phone ?? "N/A",
              }))
            : []
        );

        const validProductData = Array.isArray(productData)
          ? productData.filter((p) => p.productId)
          : [];

        const sortedProducts = validProductData.sort((a, b) => {
          const stockA = a.currentStock ?? a.inventory?.quantity ?? 0;
          const stockB = b.currentStock ?? b.inventory?.quantity ?? 0;
          return stockB - stockA;
        });

        setAllProducts(sortedProducts);
        setProductsFound(sortedProducts);

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        staticMessage.error("Không thể tải dữ liệu ban đầu!");
      } finally {
        setLoadingCustomers(false);
        setLoadingProducts(false);
      }
    };
    fetchInitialData();
  }, []);

  const addProductToCart = (p: SwaggerProduct) => {
    console.log("addProductToCart received product:", p);
    const stock = p.currentStock ?? p.inventory?.quantity ?? 0;
    console.log("Calculated stock:", stock);
    if (stock <= 0) {
      message.error("Sản phẩm đã hết hàng!");
      return;
    }
    setCart((prev) => {
      const exist = prev.find((c) => c.productId === p.productId);
      if (exist) {
        const newQty = Math.min(exist.quantity + 1, stock);
        return prev.map((c) =>
          c.productId === p.productId ? { ...c, quantity: newQty } : c
        );
      }
      return [
        ...prev,
        {
          productId: p.productId,
          productName: p.productName,
          price: p.price,
          quantity: 1,
          stock: stock,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, qty: number | null) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId === productId) {
          const newQty = Math.max(1, Math.min(qty || 1, c.stock));
          return { ...c, quantity: newQty };
        }
        return c;
      })
    );
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((c) => c.productId !== id));

 const handleSearch = async () => {
    if (!productQuery) {
      setProductsFound(allProducts);
      return;
    }
    setLoadingSearch(true);

    const query = productQuery.toLowerCase();
    const isNumericQuery = /^\d+$/.test(productQuery);

    // Ưu tiên quét barcode nếu là số
    if (isNumericQuery) {
      try {
        const productFromApi = await posApi.scanBarcode(productQuery);
        console.log("handleSearch received from API:", productFromApi);
        addProductToCart(productFromApi);
        message.success(`Đã thêm: ${productFromApi.productName}`);
        setProductQuery(""); 
        setProductsFound(allProducts); 
        setLoadingSearch(false);
        return; 

      } catch (err: any) {
        if (!(err.response && err.response.status === 404)) {
            console.error("Lỗi quét barcode:", err);
            message.error("Lỗi khi quét barcode!");
            setLoadingSearch(false);
            return; 
        }
      }
    }

    const localFound = allProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(query) ||
        p.barcode?.includes(query) 
    );

    setProductsFound(localFound);
    if (localFound.length === 0) {
      message.warning("Không tìm thấy sản phẩm nào!");
    }
    setLoadingSearch(false);
  };

  const { subtotal, discount, total } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let disc = 0;
    if (appliedPromotion) {
      if (appliedPromotion.discountType === "fixed" || appliedPromotion.discountType === "fixed_amount") {
        disc = appliedPromotion.discountValue;
      } else {
        disc = Math.round((sub * appliedPromotion.discountValue) / 100);
      }
    }
    const finalTotal = Math.max(sub - disc, 0);
    setPaidAmount(finalTotal);
    return { subtotal: sub, discount: disc, total: finalTotal };
  }, [cart, appliedPromotion]);

  const applyPromotion = async () => {
    if (!promoCode) return message.warning("Nhập mã khuyến mãi!");
    try {
      const res = await posApi.validatePromotion(promoCode, subtotal);
      if (res.valid) {
        setAppliedPromotion(res.promo ?? res.promotion);
        message.success("Áp dụng mã thành công!");
      } else {
        setAppliedPromotion(null);
        message.error(res.reason || "Mã không hợp lệ!");
      }
    } catch (err: any) {
      const reason = err.response?.data?.message || "Không thể kiểm tra mã!";
      setAppliedPromotion(null);
      message.error(reason);
    }
  };

  const resetPos = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPromoCode("");
    setAppliedPromotion(null);
    setPaymentMethod("cash");
    setPaymentModalOpen(false); 
    setPaidAmount(null);      
    const el = document.getElementById("product-search");
    if (el) (el as HTMLInputElement).value = "";
    setProductsFound(allProducts); 
  };
  const printReceipt = (
    order: Order,
    items: CartItem[],
    customer: Customer | null,
    totalAmount: number,
    cash: number
  ) => {
    console.log("--- HÓA ĐƠN ---");
    console.log(`Mã ĐH: ${order.orderId ?? order.id}`);
    console.log(`Ngày: ${new Date(order.createdAt).toLocaleString()}`);
    if (customer) {
      console.log(`Khách hàng: ${customer.customerName ?? customer.name}`);
    }
    console.log("---");
    items.forEach((item) => {
      console.log(
        `${item.productName} | ${item.quantity} x ${formatCurrency(item.price)}`
      );
    });
    console.log("---");
    console.log(`Tạm tính: ${formatCurrency(subtotal)}`);
    console.log(`Giảm giá: ${formatCurrency(discount)}`);
    console.log(`THÀNH TIỀN: ${formatCurrency(totalAmount)}`);
    console.log(`Phương thức: ${paymentMethod}`);
    if (paymentMethod === "cash") {
      console.log(`Tiền khách đưa: ${formatCurrency(cash)}`);
      console.log(`Tiền thối: ${formatCurrency(Math.max(cash - totalAmount, 0))}`);
    }
    console.log("--- Cảm ơn quý khách! ---");
  };


  const handleCheckout = async () => {
    if (!user) {
      message.error("Lỗi xác thực, vui lòng đăng nhập lại!");
      return;
    }
    if (cart.length === 0) {
      message.error("Giỏ hàng trống!");
      return;
    }
    if (paymentMethod === "cash" && (paidAmount === null || paidAmount < total)) {
      message.error("Số tiền khách trả không hợp lệ!");
      return;
    }

    setLoadingCheckout(true);
    try {
      message.loading("Đang xử lý đơn hàng...", 0);

      const payload = {
        userId: user.id,
        customerId: selectedCustomer?.customerId ?? selectedCustomer?.id,
        promoId: appliedPromotion?.promoId,
        paymentMethod: paymentMethod,
        orderItems: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: "paid",
      };

      const createdOrder = await posApi.createFullOrder(payload);

      message.destroy();
      message.success("Thanh toán thành công!");

      printReceipt(createdOrder, cart, selectedCustomer, total, paidAmount ?? total);
      resetPos(); 

    } catch (err: any) {
      message.destroy();
      console.error("Lỗi thanh toán:", err);
      const errorMsg = err.response?.data?.message || "Lỗi khi xử lý thanh toán!";
      message.error(`Thanh toán thất bại: ${errorMsg}`);
    } finally {
      setLoadingCheckout(false);
    }
  };


  const columns = [
    { title: "Sản phẩm", dataIndex: "productName", key: "name" },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (v: number) => formatCurrency(v),
      align: "right" as const,
    },
    {
      title: "SL",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      render: (q: number, r: CartItem) => (
        <InputNumber
          min={1}
          max={r.stock || 1}
          value={q}
          onChange={(value) => updateQuantity(r.productId, value)}
          style={{ width: 70 }}
        />
      ),
      align: "center" as const,
    },
    {
      title: "Tổng",
      key: "subtotal",
      render: (_: any, r: CartItem) => formatCurrency(r.price * r.quantity),
      align: "right" as const,
    },
    {
      title: "Xóa",
      key: "action",
      align: "center" as const,
      render: (_: any, r: CartItem) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          type="text"
          onClick={() => removeFromCart(r.productId)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row gutter={24}>
          {/* === CỘT TRÁI (Sản phẩm & Giỏ hàng) === */}
          <Col xs={24} md={15}>
            <Title level={4}>Bán hàng (POS)</Title>
            <Space style={{ marginBottom: 16 }}>
              <Input
                id="product-search" 
                placeholder="Quét mã vạch hoặc nhập tên sản phẩm"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                style={{ width: 300 }}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Button
                type="primary"
                onClick={handleSearch}
                loading={loadingSearch}
              >
                Tìm / Thêm
              </Button>
            </Space>

            <Divider />
            <Title level={5}>Danh sách sản phẩm</Title>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                paddingBottom: "10px",
                background: "#f9f9f9",
                border: "1px solid #f0f0f0",
                borderRadius: "8px"
              }}
            >
              <Spin spinning={loadingProducts}>
                <div style={{ padding: 16 }}>
                  <Space wrap size={16}>
                    {productsFound.length > 0 ? (
                      productsFound.map((p) => {
                        const stock = p.currentStock ?? p.inventory?.quantity ?? 0;
                        const isOutOfStock = stock <= 0;
                        return (
                          <Card
                            key={p.productId}
                            size="small"
                            style={{
                              width: 180,
                              cursor: isOutOfStock ? 'not-allowed' : "pointer",
                              borderColor: isOutOfStock ? "#ffccc7" : "#d9d9d9"
                            }}
                            onClick={() => !isOutOfStock && addProductToCart(p)}
                            hoverable={!isOutOfStock}
                            styles={{ body: { opacity: isOutOfStock ? 0.6 : 1 } }}
                          >
                            <Text strong ellipsis>
                              {p.productName}
                            </Text>
                            <div>{formatCurrency(p.price)}</div>
                            <div style={{ color: stock > 0 ? 'inherit' : 'red', fontSize: '0.9em' }}>
                              Tồn: {stock}
                            </div>
                          </Card>
                        )
                      })
                    ) : (
                      <Text type="secondary">Không tìm thấy sản phẩm nào.</Text>
                    )}
                  </Space>
                </div>
              </Spin>
            </div>

            <Divider />
            <Title level={5}>Giỏ hàng</Title>
            <Table
              columns={columns}
              dataSource={cart}
              pagination={false}
              rowKey="productId"
              locale={{ emptyText: "Giỏ hàng trống" }}
              size="small"
            />
          </Col>

          {/* === CỘT PHẢI (Thanh toán) === */}
          <Col xs={24} md={9}>
            <Card style={{ position: "sticky", top: 24 }}>
              <Title level={5}>Khách hàng</Title>
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn khách hàng (có thể tìm kiếm)"
                value={selectedCustomer ? (selectedCustomer.customerId ?? selectedCustomer.id) : 0}
                onChange={(selectedValue) => {
                  if (selectedValue === 0) {
                    setSelectedCustomer(null);
                  } else {
                    const c = customers.find(
                      (x) => (x.customerId ?? x.id) === selectedValue
                    );
                    setSelectedCustomer(c ?? null);
                  }
                }}
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                loading={loadingCustomers}
                notFoundContent={
                  loadingCustomers ? <Spin size="small" /> : "Không tìm thấy"
                }
              >
                <Option key="guest" value={0} label="Khách vãng lai">
                  Khách vãng lai
                </Option>
                {customers.map((c) => (
                  <Option
                    key={c.customerId ?? c.id}
                    value={c.customerId ?? c.id!}
                    label={`${c.customerName ?? c.name} - ${c.phoneNumber ?? c.phone}`}
                  >
                    {`${c.customerName ?? c.name} - ${c.phoneNumber ?? c.phone}`}
                  </Option>
                ))}
              </Select>

              <Divider />
              <Title level={5}>Khuyến mãi</Title>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Nhập mã KM"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button onClick={applyPromotion} disabled={cart.length === 0}>
                  Áp dụng
                </Button>
              </Space.Compact>
              {appliedPromotion && (
                <div style={{ marginTop: 6, color: "green" }}>
                  <Text strong>Đã áp dụng:</Text> {appliedPromotion.promoCode} (-
                  {formatCurrency(discount)})
                </div>
              )}

              <Divider />
              <Statistic
                title="Tạm tính"
                value={subtotal}
                formatter={formatCurrency}
              />
              <Statistic
                title="Giảm giá"
                value={discount > 0 ? discount : 0}
                formatter={formatCurrency}
                valueStyle={{ color: discount > 0 ? "red" : "inherit" }}
              />
              <Divider style={{ margin: "12px 0" }} />
              <Statistic
                title="Tổng cộng"
                value={total}
                formatter={formatCurrency}
                valueStyle={{ color: "#1890ff", fontSize: '1.5em' }}
              />

              <Divider />
              <Title level={5}>Thanh toán</Title>
              <Form layout="vertical">
                <Form.Item label="Phương thức">
                  <Select
                    value={paymentMethod}
                    onChange={(v) =>
                      setPaymentMethod(v as "cash" | "card" | "transfer")
                    }
                    style={{ width: "100%" }}
                  >
                    <Option value="cash">Tiền mặt</Option>
                    <Option value="card">Thẻ</Option>
                    <Option value="transfer">Chuyển khoản</Option>
                  </Select>
                </Form.Item>
                {paymentMethod === "cash" && (
                  <Form.Item label="Số tiền khách đưa">
                    <InputNumber
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => Number(value?.replace(/[^0-9]/g, "") || 0)}
                      style={{ width: "100%" }}
                      value={paidAmount}
                      onChange={(value) => setPaidAmount(value as number)}
                      min={0}
                    />
                  </Form.Item>
                )}
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={cart.length === 0 || loadingCheckout}
                  loading={loadingCheckout}
                >
                  Xác nhận & Thanh toán
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        open={paymentModalOpen}
        title="Xác nhận thanh toán"
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handleCheckout}
        confirmLoading={loadingCheckout}
        okText="Thanh toán"
        cancelText="Hủy"
      >
        <p>
          Tổng tiền cần thanh toán:{" "}
          <strong style={{ color: "#1890ff", fontSize: '1.2em' }}>
            {formatCurrency(total)}
          </strong>
        </p>
        <p>
          Phương thức:{" "}
          {paymentMethod === "cash"
            ? "Tiền mặt"
            : paymentMethod === "card"
            ? "Thẻ"
            : "Chuyển khoản"}
        </p>
        {paymentMethod === "cash" && (
          <>
            <p>Tiền khách đưa: {formatCurrency(paidAmount ?? 0)}</p>
            <p>
              Tiền thối lại:{" "}
              <strong style={{ color: "green", fontSize: '1.1em' }}>
                {formatCurrency(Math.max((paidAmount ?? 0) - total, 0))}
              </strong>
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};

const PosPage: React.FC = () => (
  <App>
    <PosPageInternal />
  </App>
);

export default PosPage;