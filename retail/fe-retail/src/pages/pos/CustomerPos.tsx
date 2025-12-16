import React, { useEffect, useMemo, useState } from "react";
import { App, Card, Col, Row, Statistic, Typography, Spin } from "antd";
import { CartItem } from "../../api/posApi";

const { Title, Text } = Typography;

const formatCurrency = (value: string | number | bigint) => {
  const numValue = Number(value);
  if (Number.isNaN(numValue)) return String(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numValue);
};

const CustomerPosInternal: React.FC = () => {
  const { message } = App.useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(10);
  const [summary, setSummary] = useState<{
    subtotal: number;
    discount: number;
    total: number;
  } | null>(null);

  const channelRef = React.useRef<BroadcastChannel | null>(null);

  const { subtotal, total, discount } = useMemo(() => {
    if (summary) {
      return {
        subtotal: summary.subtotal,
        discount: summary.discount,
        total: summary.total,
      };
    }

    const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return { subtotal: sub, total: sub, discount: 0 };
  }, [cart, summary]);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    if (!(globalThis.window as any).BroadcastChannel) {
      setChannelError(
        "Trình duyệt không hỗ trợ chế độ 2 màn hình POS (BroadcastChannel). Vui lòng sử dụng trình duyệt hiện đại như Chrome."
      );
      return;
    }

    const channel = new globalThis.BroadcastChannel("pos-dual-screen");
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case "STATE_SYNC": {
          setConnected(true);
          if (Array.isArray(payload?.cart)) {
            setCart(payload.cart);
          }
          if (
            typeof payload?.subtotal === "number" &&
            typeof payload?.discount === "number" &&
            typeof payload?.total === "number"
          ) {
            setSummary({
              subtotal: payload.subtotal,
              discount: payload.discount,
              total: payload.total,
            });
          }
          if (payload?.orderId) {
            const createdId = payload.orderId ?? payload.OrderId ?? payload.id;
            setOrderId(createdId ?? null);
          }
          if (payload?.status) {
            const statusFromPayload =
              (payload.status as string) || (payload.Status as string) || null;
            setOrderStatus(statusFromPayload);
          }
          break;
        }
        case "STATE_UPDATED": {
          if (Array.isArray(payload?.cart)) {
            setCart(payload.cart);
          }
          if (
            typeof payload?.subtotal === "number" &&
            typeof payload?.discount === "number" &&
            typeof payload?.total === "number"
          ) {
            setSummary({
              subtotal: payload.subtotal,
              discount: payload.discount,
              total: payload.total,
            });
          }
          break;
        }
        case "OPEN_MOMO_PAY_URL": {
          const url = payload?.payUrl || payload?.url || payload?.href || null;
          if (url && globalThis.window !== undefined) {
            globalThis.window.location.href = url;
          }
          break;
        }
        case "MOMO_PAID": {
          const createdId =
            payload?.orderId ?? payload?.OrderId ?? payload?.id ?? null;
          setOrderId(createdId ?? orderId);
          setOrderStatus("paid");
          setPaymentSuccess(true);
          setSuccessCountdown(10);
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
  }, [message, orderId]);

  // Đếm ngược 10s sau khi thanh toán thành công, rồi reset màn hình khách về trạng thái ban đầu
  useEffect(() => {
    if (!paymentSuccess) return;

    const timer = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reset trạng thái màn hình khách
          setCart([]);
          setOrderId(null);
          setOrderStatus(null);
          setSummary(null);
          setPaymentSuccess(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSuccess, setCart]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ maxWidth: 1024, width: "100%" }}>
        <Card
          style={{
            width: "100%",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            borderRadius: 12,
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={24}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <Title level={3} style={{ marginBottom: 4, fontWeight: 700 }}>
                    Đơn hàng của bạn
                  </Title>
                  <Text type={connected ? "success" : "secondary"}>
                    {connected
                      ? "Đang hiển thị theo màn hình nhân viên POS."
                      : "Đang chờ kết nối với màn hình nhân viên POS..."}
                  </Text>
                  {channelError && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="danger">{channelError}</Text>
                    </div>
                  )}
                </div>
                {orderId && (
                  <Text strong style={{ fontSize: 14 }}>
                    Mã đơn: #{orderId}
                    {orderStatus &&
                      (() => {
                        let friendly = orderStatus;
                        if (orderStatus === "paid") friendly = "Đã thanh toán";
                        else if (orderStatus === "pending")
                          friendly = "Đang chờ thanh toán";
                        return (
                          <span style={{ marginLeft: 8, fontWeight: 400 }}>
                            ({friendly})
                          </span>
                        );
                      })()}
                  </Text>
                )}
              </div>

              {cart.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                  }}
                >
                  <Spin spinning={!channelError} />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      {channelError ??
                        "Nhân viên đang chuẩn bị giỏ hàng cho bạn..."}
                    </Text>
                  </div>
                </div>
              ) : (
                <div
                  style={
                    {
                      maxHeight: "50vh",
                      overflowY: "auto",
                      marginBottom: 16,
                      paddingRight: 4,
                    } as React.CSSProperties
                  }
                >
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #f0f0f0",
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.productName}
                        >
                          {item.productName}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#888",
                          }}
                        >
                          Số lượng:{" "}
                          <strong style={{ color: "#111" }}>
                            {item.quantity}
                          </strong>
                        </div>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          minWidth: 120,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#888",
                          }}
                        >
                          Đơn giá
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#1890ff",
                          }}
                        >
                          {formatCurrency(item.price)}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            marginTop: 2,
                            color: "#666",
                          }}
                        >
                          Thành tiền:{" "}
                          <strong>
                            {formatCurrency(item.price * item.quantity)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Tạm tính"
                    value={subtotal}
                    formatter={formatCurrency}
                    valueStyle={{ fontSize: "1.4em" }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Giảm giá"
                    value={discount}
                    formatter={formatCurrency}
                    valueStyle={{
                      color: discount > 0 ? "#ff4d4f" : "inherit",
                      fontSize: "1.4em",
                    }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Tổng cộng"
                    value={total}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#1890ff", fontSize: "1.4em" }}
                  />
                </Col>
              </Row>

              <div style={{ marginTop: 16 }}>
                {paymentSuccess ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      background: "#f6ffed",
                      border: "1px solid #b7eb8f",
                      textAlign: "center",
                    }}
                  >
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Thanh toán thành công!
                    </Title>
                    <Text style={{ fontSize: 13 }}>
                      Cảm ơn bạn đã thanh toán. Màn hình sẽ trở về trạng thái
                      ban đầu sau{" "}
                      <span style={{ fontWeight: 600 }}>
                        {successCountdown}
                      </span>{" "}
                      giây.
                    </Text>
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Vui lòng kiểm tra lại thông tin sản phẩm, số lượng và tổng
                    tiền. Nhân viên sẽ hỗ trợ bạn hoàn tất thanh toán.
                  </Text>
                )}
              </div>
            </Col>

            {/* Không hiển thị QR MoMo nữa, chỉ còn giỏ hàng + tổng tiền */}
          </Row>
        </Card>
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
