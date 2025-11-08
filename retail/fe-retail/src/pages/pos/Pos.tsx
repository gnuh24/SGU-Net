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
import { BrowserMultiFormatReader } from "@zxing/browser";


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

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
  let reader: BrowserMultiFormatReader | null = null;
  let activeStream: MediaStream | null = null;

  if (scannerOpen) {
    reader = new BrowserMultiFormatReader();
    setScanning(true);

    reader
      .decodeOnceFromVideoDevice(undefined, videoRef.current!)
      .then(async (result) => {
        const code = result.getText(); // 👉 nội dung QR (ví dụ "8900000000001")
        message.success(`Đã quét QR: ${code}`);
        setScannerOpen(false);
        setScanning(false);

        try {
          const product = await posApi.scanBarcode(code);
          addProductToCart(product);
          message.success(`Đã thêm sản phẩm: ${product.productName}`);
        } catch (error) {
          console.error(error);
          message.error("Không tìm thấy sản phẩm tương ứng!");
        }
      })
      .catch((err) => {
        console.warn("Lỗi hoặc hủy quét:", err);
        setScanning(false);
      });

    // Lưu lại stream để dừng thủ công khi đóng modal
    const interval = setInterval(() => {
      if (videoRef.current?.srcObject && !activeStream) {
        activeStream = videoRef.current.srcObject as MediaStream;
        clearInterval(interval);
      }
    }, 300);
  }

  // ✅ Cleanup: khi modal đóng hoặc unmount, dừng camera ngay
  return () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    reader = null;
  };
}, [scannerOpen]);


  
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
    const stock = p.currentStock ?? p.inventory?.quantity ?? 0;
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
        addProductToCart(productFromApi);
        message.success(`Đã thêm: ${productFromApi.productName}`);
        setProductQuery("");
        setProductsFound(allProducts);
        setLoadingSearch(false);
        return;
      } catch (err: any) {
        if (!(err.response && err.response.status === 404)) {
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
      // Kiểm tra loại giảm giá: fixed/fixed_amount hoặc percentage/percent
      if (
        appliedPromotion.discountType === "fixed" ||
        appliedPromotion.discountType === "fixed_amount"
      ) {
        // Giảm giá cố định (VNĐ)
        disc = appliedPromotion.discountValue;
      } else if (
        appliedPromotion.discountType === "percentage" ||
        appliedPromotion.discountType === "percent"
      ) {
        // Giảm giá theo %
        // Fix: Nếu discountValue < 1, có thể backend trả về dạng decimal (0.1 = 10%)
        let percentValue = appliedPromotion.discountValue;
        if (percentValue > 0 && percentValue < 1) {
          // Backend trả về dạng 0.1 cho 10% -> nhân 100
          percentValue = percentValue * 100;
        }
        disc = Math.round((sub * percentValue) / 100);
      } else {
        // Mặc định coi như percentage nếu không rõ
        let percentValue = appliedPromotion.discountValue;
        if (percentValue > 0 && percentValue < 1) {
          percentValue = percentValue * 100;
        }
        disc = Math.round((sub * percentValue) / 100);
      }
    }
    const finalTotal = Math.max(sub - disc, 0);
    setPaidAmount(finalTotal);
    return { subtotal: sub, discount: disc, total: finalTotal };
  }, [cart, appliedPromotion]);

  const applyPromotion = async () => {
    if (!promoCode.trim()) {
      message.warning("Vui lòng nhập mã khuyến mãi!");
      return;
    }
    if (cart.length === 0) {
      message.warning("Giỏ hàng trống, không thể áp dụng khuyến mãi!");
      return;
    }

    try {
      message.loading({
        content: "Đang kiểm tra mã khuyến mãi...",
        key: "promo",
      });
      const res = await posApi.validatePromotion(promoCode.trim(), subtotal);

      if (res.valid) {
        const promotion = res.promo ?? res.promotion;
        if (promotion) {
          setAppliedPromotion(promotion);
          message.success({
            content: `✅ Áp dụng mã "${promotion.promoCode}" thành công!`,
            key: "promo",
            duration: 3,
          });
        } else {
          setAppliedPromotion(null);
          message.error({
            content: `❌ Dữ liệu khuyến mãi không hợp lệ!`,
            key: "promo",
            duration: 4,
          });
        }
      } else {
        setAppliedPromotion(null);
        // Xử lý các lý do lỗi cụ thể
        const reason = res.reason || "Mã không hợp lệ!";
        if (
          reason.toLowerCase().includes("hết hạn") ||
          reason.toLowerCase().includes("expired")
        ) {
          message.error({
            content: `❌ Mã khuyến mãi đã hết hạn!`,
            key: "promo",
            duration: 4,
          });
        } else if (
          reason.toLowerCase().includes("không tồn tại") ||
          reason.toLowerCase().includes("not found")
        ) {
          message.error({
            content: `❌ Mã khuyến mãi không tồn tại!`,
            key: "promo",
            duration: 4,
          });
        } else if (
          reason.toLowerCase().includes("inactive") ||
          reason.toLowerCase().includes("không hoạt động")
        ) {
          message.error({
            content: `❌ Mã khuyến mãi không còn hoạt động!`,
            key: "promo",
            duration: 4,
          });
        } else if (
          reason.toLowerCase().includes("đơn tối thiểu") ||
          reason.toLowerCase().includes("minimum")
        ) {
          message.error({
            content: `❌ ${reason}`,
            key: "promo",
            duration: 4,
          });
        } else {
          message.error({
            content: `❌ ${reason}`,
            key: "promo",
            duration: 4,
          });
        }
      }
    } catch (err: any) {
      setAppliedPromotion(null);
      const errorData = err.response?.data;
      let reason = "Không thể kiểm tra mã khuyến mãi!";

      if (errorData?.message) {
        reason = errorData.message;
      } else if (errorData?.error) {
        reason = errorData.error;
      } else if (err.message) {
        reason = err.message;
      }

      // Xử lý lỗi HTTP status
      if (err.response?.status === 404) {
        message.error({
          content: "❌ Mã khuyến mãi không tồn tại!",
          key: "promo",
          duration: 4,
        });
      } else if (err.response?.status === 400) {
        message.error({
          content: `❌ ${reason}`,
          key: "promo",
          duration: 4,
        });
      } else {
        message.error({
          content: `❌ ${reason}`,
          key: "promo",
          duration: 4,
        });
      }
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
    // Receipt printing logic can be implemented here
    // For now, just prepare the data
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
    if (
      paymentMethod === "cash" &&
      (paidAmount === null || paidAmount < total)
    ) {
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

      printReceipt(
        createdOrder,
        cart,
        selectedCustomer,
        total,
        paidAmount ?? total
      );
      resetPos();
    } catch (err: any) {
      message.destroy();
      console.error("Lỗi thanh toán:", err);
      const errorMsg =
        err.response?.data?.message || "Lỗi khi xử lý thanh toán!";
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

            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => setScannerOpen(true)}
              style={{ marginLeft: 16 }} 
            >
              Quét mã
            </Button>


            <Divider />
            <Title level={5}>Danh sách sản phẩm</Title>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                paddingBottom: "10px",
                background: "#f9f9f9",
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
              }}
            >
              <Spin spinning={loadingProducts}>
                <div style={{ padding: 16 }}>
                  <Space wrap size={16}>
                    {productsFound.length > 0 ? (
                      productsFound.map((p) => {
                        const stock =
                          p.currentStock ?? p.inventory?.quantity ?? 0;
                        const isOutOfStock = stock <= 0;
                        return (
                          <Card
                            key={p.productId}
                            size="small"
                            style={{
                              width: 180,
                              cursor: isOutOfStock ? "not-allowed" : "pointer",
                              borderColor: isOutOfStock ? "#ffccc7" : "#d9d9d9",
                            }}
                            onClick={() => !isOutOfStock && addProductToCart(p)}
                            hoverable={!isOutOfStock}
                            styles={{
                              body: { opacity: isOutOfStock ? 0.6 : 1 },
                            }}
                          >
                            <Text strong ellipsis>
                              {p.productName}
                            </Text>
                            <div>{formatCurrency(p.price)}</div>
                            <div
                              style={{
                                color: stock > 0 ? "inherit" : "red",
                                fontSize: "0.9em",
                              }}
                            >
                              Tồn: {stock}
                            </div>
                          </Card>
                        );
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
                value={
                  selectedCustomer
                    ? selectedCustomer.customerId ?? selectedCustomer.id
                    : 0
                }
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
                    label={`${c.customerName ?? c.name} - ${
                      c.phoneNumber ?? c.phone
                    }`}
                  >
                    {`${c.customerName ?? c.name} - ${
                      c.phoneNumber ?? c.phone
                    }`}
                  </Option>
                ))}
              </Select>

              <Divider />
              <Title level={5}>
                <TagOutlined /> Khuyến mãi
              </Title>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="Nhập mã khuyến mãi"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onPressEnter={applyPromotion}
                  disabled={cart.length === 0}
                  prefix={<TagOutlined />}
                  allowClear
                />
                <Button
                  type="primary"
                  onClick={applyPromotion}
                  disabled={cart.length === 0 || !promoCode.trim()}
                >
                  Áp dụng
                </Button>
              </Space.Compact>
              {appliedPromotion && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: "4px",
                  }}
                >
                  <Text strong style={{ color: "#52c41a" }}>
                    ✓ Đã áp dụng: {appliedPromotion.promoCode}
                  </Text>
                  <br />
                  <Text style={{ fontSize: "0.9em", color: "#666" }}>
                    Giảm {formatCurrency(discount)}
                    {(appliedPromotion.discountType === "percentage" ||
                      appliedPromotion.discountType === "percent") &&
                      (() => {
                        let percentValue = appliedPromotion.discountValue;
                        if (percentValue > 0 && percentValue < 1) {
                          percentValue = percentValue * 100;
                        }
                        return ` (${percentValue}%)`;
                      })()}
                    {(appliedPromotion.discountType === "fixed" ||
                      appliedPromotion.discountType === "fixed_amount") &&
                      " (Giảm cố định)"}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => {
                      setAppliedPromotion(null);
                      setPromoCode("");
                      message.info("Đã hủy mã khuyến mãi");
                    }}
                    style={{ float: "right", padding: 0 }}
                  >
                    Hủy
                  </Button>
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
                valueStyle={{ color: "#1890ff", fontSize: "1.5em" }}
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
                      parser={(value) =>
                        Number(value?.replace(/[^0-9]/g, "") || 0)
                      }
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
          <strong style={{ color: "#1890ff", fontSize: "1.2em" }}>
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
              <strong style={{ color: "green", fontSize: "1.1em" }}>
                {formatCurrency(Math.max((paidAmount ?? 0) - total, 0))}
              </strong>
            </p>
          </>
        )}
      </Modal>

      <Modal
        open={scannerOpen}
        title="Quét mã vạch sản phẩm"
        onCancel={() => setScannerOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ textAlign: "center" }}>
          <video
            ref={videoRef}
            style={{
              width: "100%",
              maxHeight: "400px",
              borderRadius: "8px",
              background: "#000",
            }}
          />
          <div style={{ marginTop: 12 }}>
            {scanning ? (
              <Spin tip="Đang quét..." />
            ) : (
              <Button onClick={() => setScannerOpen(false)}>Đóng</Button>
            )}
          </div>
        </div>
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
