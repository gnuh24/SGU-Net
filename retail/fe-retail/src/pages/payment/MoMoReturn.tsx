import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Result, Button, Spin, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { API_BASE_URL } from "../../constants";
import apiService from "@/services/apiService";

const MoMoReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "pending" | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [hasShownSuccess, setHasShownSuccess] = useState(false); // Flag để chỉ hiển thị success 1 lần
  const [isChecking, setIsChecking] = useState(false); // Flag để tránh multiple calls
  const MAX_RETRIES = 5; // Tối đa 5 lần retry (15 giây)
  const RETRY_DELAY = 3000; // Retry sau 3 giây (thay vì 2 giây)
  const retryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPosDual = searchParams.get("source") === "posdual";

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const orderIdParam = searchParams.get("orderId");
        const resultCode = searchParams.get("resultCode");
        const messageParam = searchParams.get("message");

        if (!orderIdParam) {
          setPaymentStatus("failed");
          setErrorMessage("Không tìm thấy thông tin đơn hàng");
          setLoading(false);
          return;
        }

        const id = parseInt(orderIdParam);
        setOrderId(id);

        // Kiểm tra resultCode từ URL (nếu có)
        if (resultCode !== null) {
          if (resultCode === "0") {
            // MoMo báo thành công - hiển thị success ngay (chỉ 1 lần)
            if (!hasShownSuccess) {
              setPaymentStatus("success");
              // Với luồng POS 2 màn hình, màn hình khách sẽ hiển thị thông báo riêng,
              // nên ở đây chỉ cần cập nhật trạng thái, không cần Result to nữa.
              if (!isPosDual) {
                message.success("Thanh toán MoMo thành công!", 3); // Duration 3 giây
              }
              setHasShownSuccess(true);
              setLoading(false);
            }
            
            // Chỉ kiểm tra database 1 lần để xác nhận, không retry liên tục
            if (!isChecking && retryCount === 0) {
              console.log("resultCode: ",resultCode);
              verifyOrderStatus(id, true);

              // Sau 5 giây, nếu vẫn pending, thử manual update
              setTimeout(async () => {
                try {
                  const statusResponse = await axios.get(`${API_BASE_URL}/orders/${id}`);
                  const order = statusResponse.data?.data || statusResponse.data;
                  if (order && order.status === "pending") {
                    // Thử manual update vì callback có thể chưa đến
                    await axios.post(`${API_BASE_URL}/payments/momo/manual-update/${id}`, {});
                    console.log("Manual update triggered for order", id);
                  }
                } catch (error) {
                  console.error("Error in manual update:", error);
                }
              }, 5000);
            }
          } else {
            const isCanceled = 
              resultCode === "1001" || 
              resultCode === "1002" || 
              resultCode === "1006" ||
              resultCode === "1003" ||
              (messageParam && (
                messageParam.toLowerCase().includes("cancel") ||
                messageParam.toLowerCase().includes("hủy") ||
                messageParam.toLowerCase().includes("huy")
              ));

            if (isCanceled) {
              console.log("resultCode: ",resultCode);

              try {
                await apiService.patch<boolean>(
                  `/orders/cancel/${orderId}`
                );
      
                message.success("Hủy đơn hàng thành công");
              } catch (error: any) {
                message.error(error.message);
              }

              setPaymentStatus("failed");
              setErrorMessage("Giao dịch đã bị hủy bởi người dùng");
              message.warning("Giao dịch đã bị hủy", 5);
              setLoading(false);
              
              if (orderId) {
                setTimeout(async () => {
                  try {
                    const statusResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
                  } catch (error) {
                    console.error("Error checking order status:", error);
                  }
                }, 1000);
              }
            } else {
              setPaymentStatus("failed");
              setErrorMessage(messageParam || "Thanh toán thất bại");
              message.error(messageParam || "Thanh toán thất bại", 5);
              setLoading(false);
            }
          }
          return;
        }

        // Nếu không có resultCode, kiểm tra order status từ backend
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
      // Tránh multiple calls đồng thời
      if (isChecking) return;
      
      setIsChecking(true);
      try {
        // Gọi API để lấy thông tin order từ database
        const response = await axios.get(`${API_BASE_URL}/orders/${id}`);
        const order = response.data?.data || response.data;

        if (order) {
          if (order.status === "paid") {
            // Đã thanh toán thành công
            if (!isBackgroundCheck && !hasShownSuccess) {
              setPaymentStatus("success");
              message.success("Thanh toán MoMo thành công!", 3);
              setHasShownSuccess(true);
              setLoading(false);
            }
            // Dừng retry nếu đã thành công
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
            setIsChecking(false);
            return; // Dừng ngay, không retry nữa
          } else if (order.status === "pending") {
            if (!isBackgroundCheck) {
              setPaymentStatus("pending");
              setErrorMessage(`Đơn hàng đang chờ xử lý thanh toán. Đang kiểm tra lại... (${retryCount + 1}/${MAX_RETRIES})`);
              setLoading(false);
            }
            
            // Retry nếu chưa vượt quá số lần tối đa và chưa thành công
            if (retryCount < MAX_RETRIES && paymentStatus !== "success" && !hasShownSuccess) {
              setRetryCount(prev => prev + 1);
              retryTimeoutRef.current = setTimeout(() => {
                setIsChecking(false);
                verifyOrderStatus(id, isBackgroundCheck);
              }, RETRY_DELAY);
            } else {
              // Đã retry quá nhiều lần hoặc đã thành công
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

    // Cleanup timeout khi component unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [searchParams, hasShownSuccess, isChecking, retryCount, paymentStatus]);

  // Khi thanh toán thành công và là luồng POS 2 màn hình,
  // broadcast cho POS & POS USER rồi điều hướng về màn hình khách.
  useEffect(() => {
    if (paymentStatus !== "success" || !orderId || !isPosDual) return;

    try {
      if (typeof window !== "undefined" && (window as any).BroadcastChannel) {
        const channel = new window.BroadcastChannel("pos-dual-screen");
        channel.postMessage({
          type: "MOMO_PAID",
          payload: {
            orderId,
          },
        });
        channel.close();
      }
    } catch (err) {
      console.error("Không thể broadcast MOMO_PAID tới POS:", err);
    }

    // Điều hướng trở lại màn hình POS USER
    navigate("/pos/customer", { replace: true });
  }, [paymentStatus, orderId, isPosDual, navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" tip="Đang kiểm tra trạng thái thanh toán..." />
      </div>
    );
  }

  if (paymentStatus === "success") {
    // Với luồng POS 2 màn hình, component này sẽ ngay lập tức điều hướng về /pos/customer
    // nên ở đây chỉ hiển thị một màn hình chờ đơn giản (trong trường hợp redirect chậm).
    if (isPosDual) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Spin size="large" tip="Đang chuyển về màn hình khách..." />
        </div>
      );
    }

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          title="Thanh toán thành công!"
          subTitle={`Đơn hàng #${orderId} đã được thanh toán thành công qua MoMo.`}
          extra={[
            <Button type="primary" key="orders" onClick={() => navigate("/orders?refresh=true")}>
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
            <Button key="orders" onClick={() => navigate("/orders?refresh=true")}>
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
            <Button key="orders" onClick={() => navigate("/orders?refresh=true")}>
              Xem đơn hàng
            </Button>,
          ]}
      />
    </div>
  );
};

export default MoMoReturn;

