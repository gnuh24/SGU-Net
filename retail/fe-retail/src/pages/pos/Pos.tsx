import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Table,
  Space,
  Select,
  Modal,
  InputNumber,
  message,
  Typography,
  Divider,
  Spin, // Thêm Spin
} from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
// 🎯 SỬA: Import 'SwaggerProduct' từ file api
import { posApi, SwaggerProduct } from "../../api/posApi";
import { useAuth } from "../../hooks/useAuth";

import { formatCurrency } from "../../utils/helpers";
// 🎯 SỬA: Chỉ import Customer và Promotion, vì Product đã dùng SwaggerProduct
import type { Customer, Promotion } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;

// Interface cho giỏ hàng
interface PosCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  inventoryQuantity: number;
}

type PaymentMethod = "cash" | "card" | "transfer";

const PosPage: React.FC = () => {
  const { user } = useAuth();
  const [productQuery, setProductQuery] = useState("");
  const [productsFound, setProductsFound] = useState<SwaggerProduct[]>([]); // 🎯 SỬA: Dùng SwaggerProduct
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [allProducts, setAllProducts] = useState<SwaggerProduct[]>([]); // 🎯 SỬA: Dùng SwaggerProduct

  useEffect(() => {
    const fetchInitialData = async () => {
      // Tải khách hàng
      try {
        setLoadingCustomers(true);
        const data = await posApi.getCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi tải khách hàng:", err);
        message.error("Không thể tải danh sách khách hàng!");
      } finally {
        setLoadingCustomers(false);
      }

      // Tải tất cả sản phẩm
      try {
        setLoadingProducts(true);
        const productData = await posApi.getAllProducts();
        const validProductData = Array.isArray(productData) ? productData : [];
        setAllProducts(validProductData);
        setProductsFound(validProductData);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        message.error("Không thể tải danh sách sản phẩm!");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchInitialData();
  }, []);


  const addProductToCart = (p: SwaggerProduct) => { // 🎯 SỬA: Dùng SwaggerProduct
    // 🎯 SỬA LỖI NaN: Lấy tồn kho từ p.inventory.quantity
    const inventoryQty = p.inventory?.quantity || 0; 

    if (inventoryQty <= 0) {
      message.error("Sản phẩm đã hết hàng!");
      return;
    }
    setCart((prev) => {
      const exist = prev.find((c) => c.productId === p.productId); // 🎯 SỬA: p.productId
      if (exist) {
        const newQty = Math.min(exist.quantity + 1, inventoryQty);
        return prev.map((c) =>
          c.productId === p.productId ? { ...c, quantity: newQty } : c // 🎯 SỬA: p.productId
        );
      }
      return [
        ...prev,
        {
          productId: p.productId,     // 🎯 SỬA: p.productId
          name: p.productName,        // 🎯 SỬA: p.productName
          price: p.price,
          quantity: 1,
          inventoryQuantity: inventoryQty,
        },
      ];
    });
  };

  const handleSearch = async () => {
    if (!productQuery) {
      setProductsFound(allProducts);
      return;
    }
    setLoadingSearch(true);
    setProductsFound([]); 

    try {
      const product = await posApi.scanBarcode(productQuery);
      addProductToCart(product); 
      message.success(`Đã thêm: ${product.productName}`); // 🎯 SỬA: product.productName
      setProductQuery(""); 
      setProductsFound(allProducts); 
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        const query = productQuery.toLowerCase();
        const foundProducts = allProducts.filter(p => 
          p.productName.toLowerCase().includes(query) || // 🎯 SỬA: p.productName
          p.barcode?.includes(query)
        );
        setProductsFound(foundProducts);
        if (foundProducts.length === 0) {
          message.warning("Không tìm thấy sản phẩm nào!");
        }
      } else {
        console.error("Lỗi tìm kiếm:", err);
        message.error("Lỗi khi tìm sản phẩm!");
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const updateQuantity = (productId: number, qty: number | null) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId === productId) {
          const maxQty = c.inventoryQuantity || 0;
          const newQty = Math.max(1, Math.min(qty || 1, maxQty)); 
          return { ...c, quantity: newQty };
        }
        return c;
      })
    );
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((c) => c.productId !== id));

  const subTotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart]
  );
  const discountAmount = appliedPromo
    ? appliedPromo.discount_type === "percentage"
      ? Math.round((subTotal * appliedPromo.discount_value) / 100)
      : appliedPromo.discount_value
    : 0;
  const totalAmount = Math.max(subTotal - discountAmount, 0);

  const applyPromotion = async () => {
    if (!promoCode) return message.warning("Nhập mã khuyến mãi!");
    try {
      const res = await posApi.validatePromotion(promoCode, subTotal);
      if (res.valid) {
        setAppliedPromo(res.promo);
        message.success("Áp dụng mã thành công!");
      } else {
        setAppliedPromo(null);
        message.error(res.reason || "Mã không hợp lệ!");
      }
    } catch (err: any) {
      console.error("Lỗi kiểm tra mã:", err);
      const reason = err.response?.data?.message || "Không thể kiểm tra mã!";
      setAppliedPromo(null);
      message.error(reason);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return message.warning("Giỏ hàng trống!");
    if (paymentMethod === "cash" && (paidAmount === null || paidAmount < totalAmount))
      return message.warning("Số tiền khách trả không hợp lệ!");
    if (!user) return message.error("Lỗi xác thực người dùng, vui lòng tải lại trang!");

    try {
      setLoadingCheckout(true);
      const orderPayload = {
        user_id: user.id,
        customer_id: selectedCustomer?.id ?? undefined,
        promo_id: appliedPromo?.id ?? undefined,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        status: "paid" as const,
      };

      const order = await posApi.createOrder(orderPayload);

      await posApi.createOrderItemsBulk({
        items: cart.map((c) => ({
          order_id: order.id,
          product_id: c.productId,
          quantity: c.quantity,
          price: c.price,
        })),
      });

      await posApi.createPayment({
        order_id: order.id,
        payment_method: paymentMethod,
        amount_paid: paidAmount ?? totalAmount,
      });

      message.success("Thanh toán thành công!");
      setCart([]);
      setAppliedPromo(null);
      setPromoCode("");
      setSelectedCustomer(null);
      setPaidAmount(null);
      setPaymentModalOpen(false);
      setProductQuery("");
      setProductsFound(allProducts);
    } catch (err) {
      console.error("Lỗi thanh toán:", err);
      message.error("Lỗi khi xử lý thanh toán!");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (t: string) => <Text>{t}</Text>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (v: number) => formatCurrency(v),
      align: "right" as const,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number, r: PosCartItem) => (
        <InputNumber
          min={1}
          max={r.inventoryQuantity || 1}
          value={q}
          onChange={(value) => updateQuantity(r.productId, value)}
        />
      ),
      align: "center" as const,
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      render: (_: any, r: PosCartItem) => formatCurrency(r.price * r.quantity),
      align: "right" as const,
    },
    {
      title: "Hành động",
      key: "action",
      align: "center" as const,
      render: (_: any, r: PosCartItem) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          size="small"
          onClick={() => removeFromCart(r.productId)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Row gutter={16}>
          {/* LEFT */}
          <Col span={16}>
            <Title level={4}>POS - Bán hàng</Title>
            <Space style={{ marginBottom: 10 }}>
              <Input
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

            {/* DANH SÁCH SẢN PHẨM HIỂN THỊ */}
            <Divider />
            <Title level={5}>Danh sách sản phẩm (chọn để thêm)</Title>
            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingBottom: '10px' }}>
              {loadingProducts ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                </div>
              ) : (
                <Space wrap>
                  {productsFound.length > 0 ? (
                    productsFound.map((p) => (
                      <Card
                        key={p.productId} // 🎯 SỬA: Dùng p.productId
                        size="small"
                        style={{ width: 180, cursor: "pointer" }}
                        onClick={() => {
                          addProductToCart(p);
                        }}
                        hoverable
                      >
                        {/* 🎯 SỬA LỖI HIỂN THỊ: Hiển thị đúng tên, giá, tồn kho */}
                        <Text strong ellipsis>{p.productName}</Text>
                        <div>{p.barcode}</div>
                        <div>{formatCurrency(p.price)}</div>
                        <div style={{ color: (p.inventory?.quantity || 0) > 0 ? 'inherit' : 'red' }}>
                          Tồn: {p.inventory?.quantity || 0}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Text type="secondary">Không tìm thấy sản phẩm nào.</Text>
                  )}
                </Space>
              )}
            </div>
            {/* KẾT THÚC DANH SÁCH SẢN PHẨM */}

            <Divider />
            <Title level={5}>Giỏ hàng</Title>
            <Table
              columns={columns}
              dataSource={cart}
              pagination={false}
              rowKey="productId"
              locale={{ emptyText: 'Giỏ hàng trống' }}
            />
          </Col>

          {/* RIGHT */}
          <Col span={8}>
            <Card>
              <Title level={5}>Khách hàng</Title>
              {/* 🎯 SỬA LỖI KEY="NULL": Dùng value={0} cho Khách vãng lai */}
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn khách hàng (có thể tìm kiếm)"
                value={selectedCustomer?.id ?? 0} // Mặc định là 0 (Khách vãng lai)
                onChange={(selectedValue) => {
                  if (selectedValue === 0) { // Nếu chọn 0
                    setSelectedCustomer(null); // Set state về null
                  } else {
                    const c = customers.find((x) => x.id === selectedValue);
                    setSelectedCustomer(c ?? null);
                  }
                }}
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                loading={loadingCustomers}
                notFoundContent={loadingCustomers ? <Spin size="small" /> : "Không tìm thấy"}
              >
                {/* Dùng key="guest-customer" và value={0} */}
                <Option key="guest-customer" value={0} label="Khách vãng lai">Khách vãng lai</Option>
                {customers.map((c) => (
                  <Option key={c.id} value={c.id} label={`${c.name} - ${c.phone ?? 'N/A'}`}>
                    {c.name} - {c.phone ?? 'Không có SĐT'}
                  </Option>
                ))}
              </Select>

              <Divider />
              <Title level={5}>Khuyến mãi</Title>
              <Space>
                <Input
                  placeholder="Nhập mã KM"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button onClick={applyPromotion} disabled={cart.length === 0}>Áp dụng</Button>
              </Space>

              {appliedPromo && (
                <div style={{ marginTop: 6, color: 'green' }}>
                  <Text strong>Đã áp dụng:</Text> {appliedPromo.promo_code} (-{formatCurrency(discountAmount)})
                </div>
              )}

              <Divider />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Tạm tính:</Text>
                <Text>{formatCurrency(subTotal)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: discountAmount > 0 ? 'red' : 'inherit' }}>
                <Text>Giảm giá:</Text>
                <Text>-{formatCurrency(discountAmount)}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong style={{ fontSize: '1.1em' }}>Tổng cộng:</Text>
                <Text strong style={{ fontSize: '1.1em', color: '#1890ff' }}>{formatCurrency(totalAmount)}</Text>
              </div>

              <Divider />
              <Title level={5}>Thanh toán</Title>
              <Select
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                style={{ width: "100%", marginBottom: 8 }}
              >
                <Option value="cash">Tiền mặt</Option>
                <Option value="card">Thẻ</Option>
                <Option value="transfer">Chuyển khoản</Option>
              </Select>

              {paymentMethod === "cash" && (
                <InputNumber
                  placeholder="Số tiền khách đưa"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/[^0-9]/g, '') || 0)}
                  style={{ width: "100%" }}
                  value={paidAmount}
                  onChange={(value) => setPaidAmount(value as number)}
                  min={0}
                />
              )}

              <Button
                type="primary"
                block
                style={{ marginTop: 10, height: 40, fontSize: '1.1em' }}
                onClick={() => setPaymentModalOpen(true)}
                disabled={cart.length === 0 || loadingCheckout}
                loading={loadingCheckout}
              >
                Xác nhận & Thanh toán
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 🧾 Modal xác nhận thanh toán */}
      <Modal
        open={paymentModalOpen}
        title="Xác nhận thanh toán"
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handleCheckout}
        confirmLoading={loadingCheckout}
        okText="Thanh toán"
        cancelText="Hủy"
      >
        <p>Tổng tiền cần thanh toán: <strong style={{color: '#1890ff'}}>{formatCurrency(totalAmount)}</strong></p>
        <p>Phương thức: {paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}</p>
        {paymentMethod === "cash" && (
          <>
            <p>Tiền khách đưa: {formatCurrency(paidAmount ?? 0)}</p>
            <p>Tiền thối lại: <strong style={{color: 'green'}}>{formatCurrency(Math.max((paidAmount ?? 0) - totalAmount, 0))}</strong></p>
          </>
        )}
        <p style={{marginTop: 15, color: 'gray'}}>Xác nhận để hoàn tất đơn hàng.</p>
      </Modal>
    </div>
  );
};

export default PosPage;