import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5260/api/v1";

const VNPayReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending" | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;
  const retryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const orderIdParam = searchParams.get("orderId");
        const responseCode = searchParams.get("responseCode");
        const status = searchParams.get("status");

        if (!orderIdParam) {
          setPaymentStatus("failed");
          setErrorMessage("Không tìm thấy thông tin đơn hàng");
          setLoading(false);
          return;
        }

        const id = parseInt(orderIdParam);
        setOrderId(id);

        // Kiểm tra status từ URL (nếu có)
        if (status !== null) {
          if (status === "success" || responseCode === "00") {
            if (!hasShownSuccess) {
              setPaymentStatus("success");
              message.success("Thanh toán VNPay thành công!", 3);
              setHasShownSuccess(true);
              setLoading(false);
            }
            
            if (!isChecking && retryCount === 0) {
              verifyOrderStatus(id, true);
            }
          } else {
            setPaymentStatus("failed");
            setErrorMessage("Thanh toán thất bại");
            message.error("Thanh toán thất bại", 5);
            setLoading(false);
          }
          return;
        }

        // Nếu không có status, kiểm tra order status từ backend
        if (!isChecking) {
          await verifyOrderStatus(id, false);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setPaymentStatus("failed");
        setErrorMessage("Lỗi khi kiểm tra trạng thái thanh toán");
        setLoading(false);
      }
    };

    const verifyOrderStatus = async (id: number, isBackgroundCheck: boolean = false) => {
      if (isChecking) return;
      
      setIsChecking(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
        const order = response.data?.data || response.data;

        if (order) {
          if (order.status === "paid") {
            if (!isBackgroundCheck && !hasShownSuccess) {
              setPaymentStatus("success");
              message.success("Thanh toán VNPay thành công!", 3);
              setHasShownSuccess(true);
              setLoading(false);
            }
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
            setIsChecking(false);
            return;
          } else if (order.status === "pending") {
            if (!isBackgroundCheck) {
              setPaymentStatus("pending");
              setErrorMessage(`Đơn hàng đang chờ xử lý thanh toán. Đang kiểm tra lại... (${retryCount + 1}/${MAX_RETRIES})`);
              setLoading(false);
            }
            
            if (retryCount < MAX_RETRIES && paymentStatus !== "success" && !hasShownSuccess) {
              setRetryCount(prev => prev + 1);
              retryTimeoutRef.current = setTimeout(() => {
                setIsChecking(false);
                verifyOrderStatus(id, isBackgroundCheck);
              }, RETRY_DELAY);
            } else {
              if (!isBackgroundCheck && paymentStatus !== "success" && !hasShownSuccess) {
                setPaymentStatus("pending");
                setErrorMessage("Đơn hàng đang chờ xử lý. Vui lòng kiểm tra lại sau hoặc liên hệ hỗ trợ.");
              }
              setIsChecking(false);
            }
          } else {
            if (!isBackgroundCheck) {
              setPaymentStatus("failed");
              setErrorMessage("Thanh toán không thành công");
              setLoading(false);
            }
            setIsChecking(false);
          }
        } else {
          if (!isBackgroundCheck) {
            setPaymentStatus("failed");
            setErrorMessage("Không tìm thấy đơn hàng");
            setLoading(false);
          }
          setIsChecking(false);
        }
      } catch (error: any) {
        console.error("Error verifying order status:", error);
        if (!isBackgroundCheck) {
          setPaymentStatus("failed");
          setErrorMessage(error.response?.data?.message || "Lỗi khi kiểm tra trạng thái đơn hàng");
          setLoading(false);
        }
        setIsChecking(false);
      }
    };

    checkPaymentStatus();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" tip="Đang kiểm tra trạng thái thanh toán..." />
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          title="Thanh toán thành công!"
          subTitle={`Đơn hàng #${orderId} đã được thanh toán thành công qua VNPay.`}
          extra={[
            <Button type="primary" key="orders" onClick={() => navigate("/orders")}>
              Xem đơn hàng
            </Button>,
            <Button key="pos" onClick={() => navigate("/pos")}>
              Quay lại POS
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (paymentStatus === "pending") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
        <Result
          icon={<Spin size="large" />}
          title="Đang xử lý thanh toán..."
          subTitle={errorMessage || "Vui lòng đợi trong giây lát, hệ thống đang kiểm tra trạng thái thanh toán."}
          extra={[
            <Button key="orders" onClick={() => navigate("/orders")}>
              Xem đơn hàng
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
      <Result
        icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
        title="Thanh toán thất bại"
        subTitle={errorMessage || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại."}
        extra={[
          <Button type="primary" key="retry" onClick={() => navigate("/pos")}>
            Thử lại
          </Button>,
          <Button key="orders" onClick={() => navigate("/orders")}>
            Xem đơn hàng
          </Button>,
        ]}
      />
    </div>
  );
};

export default VNPayReturn;

