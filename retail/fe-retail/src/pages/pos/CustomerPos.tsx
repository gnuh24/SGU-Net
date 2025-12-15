import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Card, Col, Row, Statistic, Typography, Spin } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { SwaggerProduct, CartItem } from "../../api/posApi";
import { getImageUrl } from "../../utils/imageUtils";

const { Title, Text } = Typography;

const GRID_CARD_WIDTH = 200;

const formatCurrency = (value: string | number | bigint) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return String(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numValue);
};

const CustomerPosInternal: React.FC = () => {
  const { message } = App.useApp();

  const [products, setProducts] = useState<SwaggerProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  const channelRef = React.useRef<BroadcastChannel | null>(null);

  const { subtotal, total } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return { subtotal: sub, total: sub };
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).BroadcastChannel) {
      setChannelError(
        "Trình duyệt không hỗ trợ chế độ 2 màn hình POS (BroadcastChannel). Vui lòng sử dụng trình duyệt hiện đại như Chrome."
      );
      return;
    }

    const channel = new BroadcastChannel("pos-dual-screen");
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case "STATE_SYNC": {
          setConnected(true);
          if (Array.isArray(payload?.products)) {
            setProducts(payload.products);
          }
          if (Array.isArray(payload?.cart)) {
            setCart(payload.cart);
          }
          break;
        }
        case "PRODUCTS_UPDATED": {
          if (Array.isArray(payload)) {
            setProducts(payload);
          }
          break;
        }
        case "STATE_UPDATED": {
          if (Array.isArray(payload?.cart)) {
            setCart(payload.cart);
          }
          break;
        }
        case "ORDER_CREATED": {
          const createdId =
            payload?.orderId ?? payload?.OrderId ?? payload?.id ?? null;
          setOrderId(createdId);
          setConfirming(false);
          if (createdId) {
            message.success(
              `Giỏ hàng đã được gửi cho nhân viên. Mã đơn hàng #${createdId}.`
            );
          } else {
            message.success("Giỏ hàng đã được gửi cho nhân viên.");
          }
          break;
        }
        case "SELLER_READY": {
          // Nhân viên mở lại POS → xin lại state
          channel.postMessage({ type: "REQUEST_INIT" });
          break;
        }
        default:
          break;
      }
    };

    // Yêu cầu POS gửi dữ liệu ban đầu
    channel.postMessage({ type: "REQUEST_INIT" });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [message]);

  const sendMessage = (data: any) => {
    if (!channelRef.current) {
      message.error("Không thể kết nối tới màn hình nhân viên POS.");
      return;
    }
    try {
      channelRef.current.postMessage(data);
    } catch (err) {
      console.error("Không thể gửi dữ liệu tới POS:", err);
      message.error("Không thể gửi dữ liệu tới POS.");
    }
  };

  const handleAddProduct = (productId: number) => {
    sendMessage({ type: "ADD_PRODUCT", payload: { productId } });
  };

  const handleRemoveItem = (productId: number) => {
    sendMessage({ type: "REMOVE_PRODUCT", payload: { productId } });
  };

  const handleDecreaseQty = (productId: number) => {
    const item = cart.find((c) => c.productId === productId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity - 1);
    sendMessage({
      type: "UPDATE_QUANTITY",
      payload: { productId, quantity: newQty },
    });
  };

  const handleIncreaseQty = (productId: number) => {
    const item = cart.find((c) => c.productId === productId);
    if (!item) return;
    const newQty = item.quantity + 1;
    sendMessage({
      type: "UPDATE_QUANTITY",
      payload: { productId, quantity: newQty },
    });
  };

  const handleConfirm = () => {
    if (cart.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 sản phẩm trước khi xác nhận.");
      return;
    }

    setConfirming(true);
    sendMessage({ type: "CUSTOMER_CONFIRM" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 1280, width: "100%" }}>
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card
              style={{
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div>
                  <Title level={4} style={{ marginBottom: 4 }}>
                    Chọn sản phẩm
                  </Title>
                  <Text type={connected ? "success" : "secondary"}>
                    {connected
                      ? "Đang kết nối với màn hình nhân viên POS."
                      : "Đang chờ kết nối với màn hình nhân viên POS..."}
                  </Text>
                  {channelError && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger">{channelError}</Text>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                  paddingBottom: 8,
                }}
              >
                {products.length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                    }}
                  >
                    <Spin spinning={!channelError} />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        {channelError
                          ? channelError
                          : "Đang tải danh sách sản phẩm từ POS..."}
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_CARD_WIDTH}px, 1fr))`,
                      gap: 16,
                    }}
                  >
                    {products.map((p) => {
                      const imgUrl = getImageUrl(p.imageUrl, p.image);
                      const stock =
                        p.currentStock ?? p.inventory?.quantity ?? 0;
                      const isOutOfStock = stock <= 0;

                      return (
                        <div
                          key={p.productId}
                          onClick={() =>
                            !isOutOfStock && handleAddProduct(p.productId)
                          }
                          style={{
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            borderRadius: 8,
                            overflow: "hidden",
                            border: isOutOfStock
                              ? "1px solid #ffccc7"
                              : "1px solid #e8e8e8",
                            background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: 260,
                            opacity: isOutOfStock ? 0.6 : 1,
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: 140,
                              background: "#fafafa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {imgUrl ? (
                              <img
                                alt={p.productName}
                                src={imgUrl}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div style={{ color: "#999", fontSize: 12 }}>
                                No Image
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              padding: 10,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                lineHeight: "1.2em",
                                height: 34,
                                overflow: "hidden",
                              }}
                              title={p.productName}
                            >
                              {p.productName}
                            </div>
                            <div
                              style={{
                                color: "#1890ff",
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {formatCurrency(p.price)}
                            </div>
                            <div
                              style={{
                                color: stock > 0 ? "#666" : "red",
                                fontSize: 12,
                              }}
                            >
                              Tồn: {stock}
                            </div>
                            {!isOutOfStock && (
                              <Button
                                type="primary"
                                size="small"
                                style={{ marginTop: "auto" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddProduct(p.productId);
                                }}
                              >
                                Thêm vào giỏ
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              style={{
                position: "sticky",
                top: 24,
              }}
            >
              <Title level={4}>Giỏ hàng của bạn</Title>
              {cart.length === 0 ? (
                <Text type="secondary">
                  Chưa có sản phẩm nào. Hãy chọn sản phẩm ở bên trái.
                </Text>
              ) : (
                <div
                  style={{
                    maxHeight: "50vh",
                    overflowY: "auto",
                    marginBottom: 16,
                  }}
                >
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div style={{ flex: 1, marginRight: 8 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            marginBottom: 4,
                          }}
                        >
                          {item.productName}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#888",
                          }}
                        >
                          {formatCurrency(item.price)} x {item.quantity}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#1890ff",
                            minWidth: 80,
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => handleDecreaseQty(item.productId)}
                          >
                            -
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleIncreaseQty(item.productId)}
                          >
                            +
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() => handleRemoveItem(item.productId)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Statistic
                title="Tạm tính"
                value={subtotal}
                formatter={formatCurrency}
              />
              <Statistic
                title="Tổng cộng"
                value={total}
                formatter={formatCurrency}
                valueStyle={{ color: "#1890ff", fontSize: "1.4em" }}
              />

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={handleConfirm}
                  disabled={cart.length === 0 || confirming}
                  loading={confirming}
                >
                  Tôi đã chọn xong
                </Button>
                {orderId && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    Đơn hàng của bạn đã được tạo với mã #{orderId}. Vui lòng chờ
                    nhân viên xác nhận thanh toán.
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bạn không thể áp dụng mã khuyến mãi hoặc thanh toán tại đây.
                  Nhân viên sẽ hỗ trợ bạn hoàn tất thanh toán tại quầy.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const CustomerPos: React.FC = () => (
  <App>
    <CustomerPosInternal />
  </App>
);

export default CustomerPos;
