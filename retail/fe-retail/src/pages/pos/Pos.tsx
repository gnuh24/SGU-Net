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
  AutoComplete,
} from "antd";
import {
  DeleteOutlined,
  TagOutlined,
  SearchOutlined,
  QrcodeOutlined, 
} from "@ant-design/icons";

import {
  posApi,
  SwaggerProduct,
  Customer,
  CartItem,
  Order,
  Promotion,
} from "../../api/posApi";
import { getImageUrl } from "../../utils/imageUtils";
import { useAuth } from "@/hooks/useAuth";
import { promotionService } from "../../services/promotionService";
import { BrowserMultiFormatReader } from "@zxing/browser";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

type StockFilter = "all" | "in" | "out";
type ScanMode = "product" | "customer"; 

const GRID_CARD_WIDTH = 180;

const PosPageInternal: React.FC = () => {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [productQuery, setProductQuery] = useState("");
  const [allProducts, setAllProducts] = useState<SwaggerProduct[]>([]);
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
  const [availablePromotions, setAvailablePromotions] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer" | "momo" | "vnpay"
  >("cash");
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("product"); 
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [categories, setCategories] = useState<
    { categoryId: number; categoryName?: string }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const [gridLimit, setGridLimit] = useState<number>(30);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);

  type PrintData = {
    order: Order;
    items: CartItem[];
    customer: Customer | null;
    totalAmount: number;
    cash: number;
    discountAmount: number;
    paymentMethod: string;
  };

  const [printData, setPrintData] = useState<PrintData | null>(null);
  const printAreaRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let activeStream: MediaStream | null = null;

    if (scannerOpen) {
      reader = new BrowserMultiFormatReader();
      setScanning(true);

      reader
        .decodeOnceFromVideoDevice(undefined, videoRef.current!)
        .then(async (result) => {
          const code = result.getText();
          // Đóng modal sau khi quét thành công
          setScannerOpen(false);
          setScanning(false);

          if (scanMode === "product") {
            // --- LOGIC QUÉT SẢN PHẨM ---
            message.success(`Đã quét mã sản phẩm: ${code}`);
            try {
              const product = await posApi.scanBarcode(code);
              addProductToCart(product);
              message.success(`Đã thêm sản phẩm: ${product.productName}`);
            } catch (error) {
              console.error(error);
              message.error("Không tìm thấy sản phẩm tương ứng!");
            }
          } else {
            // --- LOGIC QUÉT KHÁCH HÀNG ---
            message.success(`Đã quét mã khách hàng: ${code}`);
            const foundCustomer = customers.find((c) => {
                // So sánh số điện thoại (xóa khoảng trắng nếu có để chính xác hơn)
                const phoneInDb = (c.phoneNumber || c.phone || "").replace(/\s/g, "");
                const codeClean = code.replace(/\s/g, "");
                return phoneInDb === codeClean || phoneInDb.endsWith(codeClean);
            });

            if (foundCustomer) {
                setSelectedCustomer(foundCustomer);
                message.success(`Đã chọn khách hàng: ${foundCustomer.customerName}`);
            } else {
                message.warning(`Không tìm thấy khách hàng có SĐT: ${code}`);
            }
          }
        })
        .catch((err) => {
          console.warn("Lỗi hoặc hủy quét:", err);
          setScanning(false);
        });

      const interval = setInterval(() => {
        if (videoRef.current?.srcObject && !activeStream) {
          activeStream = videoRef.current.srcObject as MediaStream;
          clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      setScanning(false);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      reader = null;
    };
  }, [scannerOpen, message, scanMode, customers]); 

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

        const catMap = new Map<number, string | undefined>();
        sortedProducts.forEach((p) => {
          if (p.categoryId !== undefined && !catMap.has(p.categoryId)) {
            catMap.set(p.categoryId, p.categoryName ?? undefined);
          }
        });
        const cats = Array.from(catMap.entries()).map(
          ([categoryId, categoryName]) => ({
            categoryId,
            categoryName,
          })
        );
        setCategories(cats);
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
      setGridLimit(30);
      return;
    }
    setLoadingSearch(true);

    const query = productQuery.toLowerCase().trim();
    const isNumericQuery = /^\d+$/.test(productQuery.trim());

    if (isNumericQuery) {
      try {
        const productFromApi = await posApi.scanBarcode(productQuery.trim());
        addProductToCart(productFromApi);
        message.success(`Đã thêm: ${productFromApi.productName}`);
        setProductQuery("");
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

    setGridLimit(30);
    setLoadingSearch(false);
  };

  const { subtotal, discount, total } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let disc = 0;
    if (appliedPromotion) {
      if (
        appliedPromotion.discountType === "fixed" ||
        appliedPromotion.discountType === "fixed_amount"
      ) {
        disc = appliedPromotion.discountValue;
      } else {
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

  useEffect(() => {
    const loadAvailablePromotions = async () => {
      if (cart.length === 0 || subtotal === 0) {
        setAvailablePromotions([]);
        return;
      }

      try {
        setLoadingPromotions(true);
        const allPromotions = await promotionService.getPromotions();

        const today = new Date();
        const applicable = allPromotions.filter((promo: any) => {
          if (promo.status !== "active") return false;

          const startDate = new Date(promo.start_date);
          const endDate = new Date(promo.end_date);
          if (today < startDate || today > endDate) return false;

          const minAmount = promo.min_order_amount || 0;
          if (subtotal < minAmount) return false;

          return true;
        });

        setAvailablePromotions(applicable);
      } catch (error) {
        console.error("Error loading promotions:", error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadAvailablePromotions();
  }, [subtotal, cart.length]);

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "cash":
        return "Tiền mặt";
      case "card":
        return "Thẻ";
      case "transfer":
        return "Chuyển khoản";
      case "momo":
        return "MoMo";
      case "vnpay":
        return "VNPay";
      default:
        return method;
    }
  };

  const applyPromotion = async (codeOverride?: string) => {
    const codeToCheck = (typeof codeOverride === "string" ? codeOverride : promoCode)
      .trim()
      .toUpperCase();
    if (!codeToCheck.trim()) {
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
      const res = await posApi.validatePromotion(codeToCheck, subtotal);

      if (res.valid) {
        const promotion = res.promo ?? res.promotion;
        if (promotion) {
          setAppliedPromotion(promotion);
          setPromoCode(codeToCheck);
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
        const reason = res.reason || "Mã không hợp lệ!";
        message.error({ content: `❌ ${reason}`, key: "promo", duration: 4 });
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

      if (err.response?.status === 404) {
        message.error({
          content: "❌ Mã khuyến mãi không tồn tại!",
          key: "promo",
          duration: 4,
        });
      } else {
        message.error({ content: `❌ ${reason}`, key: "promo", duration: 4 });
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
    setSelectedCategoryId(0);
    setStockFilter("all");
    setMinPrice(null);
    setMaxPrice(null);
    setGridLimit(30);
    setDraftOrder(null);
  };

  const printReceipt = (
    order: Order,
    items: CartItem[],
    customer: Customer | null,
    totalAmount: number,
    cash: number,
    discountAmount: number
  ) => {
    setPrintData({
      order,
      items,
      customer,
      totalAmount,
      cash,
      discountAmount,
      paymentMethod,
    });
  };

  const handlePrintInvoice = async () => {
    if (!user) {
      message.error("Lỗi xác thực, vui lòng đăng nhập lại!");
      return;
    }

    if (cart.length === 0) {
      message.error("Giỏ hàng trống!");
      return;
    }

    if (paymentMethod === "momo" || paymentMethod === "vnpay") {
      message.warning(
        "In hóa đơn tạm tính hiện chỉ hỗ trợ cho thanh toán tại quầy (tiền mặt/thẻ/chuyển khoản)."
      );
      return;
    }

    setLoadingCheckout(true);
    try {
      message.loading("Đang tạo hóa đơn chờ thanh toán...", 0);

      let orderForReceipt = draftOrder;

      if (!orderForReceipt) {
        const payload = {
          userId: user.id,
          customerId:
            selectedCustomer?.customerId ?? selectedCustomer?.id ?? 0,
          promoId: appliedPromotion?.promoId ?? null,
          paymentMethod: paymentMethod,
          orderItems: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          status: "pending" as const,
        };

        const createdOrder = await posApi.createFullOrder(payload);
        orderForReceipt = createdOrder;
        setDraftOrder(createdOrder);
      }

      message.destroy();
      message.success("Đã tạo hóa đơn chờ thanh toán!");

      printReceipt(
        orderForReceipt,
        cart,
        selectedCustomer,
        total,
        paidAmount ?? total,
        discount
      );
    } catch (err: any) {
      message.destroy();
      console.error("Lỗi khi tạo hóa đơn chờ thanh toán:", err);
      const errorMsg =
        err.response?.data?.message || "Lỗi khi tạo hóa đơn chờ thanh toán!";
      message.error(errorMsg);
    } finally {
      setLoadingCheckout(false);
    }
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

      if (paymentMethod === "momo") {
        const payload = {
          userId: user.id,
          customerId: selectedCustomer?.customerId ?? selectedCustomer?.id,
          promoId: appliedPromotion?.promoId,
          paymentMethod: "momo" as const,
          orderItems: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          status: "pending",
        };

        const createdOrder = await posApi.createFullOrder(payload);
        message.destroy();

        message.loading("Đang tạo yêu cầu thanh toán MoMo...", 0);
        const returnUrl = `${window.location.origin}/payment/momo/return?orderId=${createdOrder.orderId}`;
        const momoPayment = await posApi.createMoMoPayment(
          createdOrder.orderId,
          total,
          returnUrl
        );

        message.destroy();

        if (momoPayment.payUrl) {
          window.location.href = momoPayment.payUrl;
        } else {
          message.error("Không thể tạo link thanh toán MoMo!");
        }
        return;
      }

      if (paymentMethod === "vnpay") {
        const payload = {
          userId: user.id,
          customerId: selectedCustomer?.customerId ?? selectedCustomer?.id,
          promoId: appliedPromotion?.promoId,
          paymentMethod: "vnpay" as const,
          orderItems: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          status: "pending",
        };

        const createdOrder = await posApi.createFullOrder(payload);
        message.destroy();

        message.loading("Đang tạo yêu cầu thanh toán VNPay...", 0);
        const returnUrl = `${window.location.origin}/payment/vnpay/return?orderId=${createdOrder.orderId}`;
        const vnpayPayment = await posApi.createVNPayPayment(
          createdOrder.orderId,
          total,
          returnUrl
        );

        message.destroy();

        if (vnpayPayment.paymentUrl) {
          window.location.href = vnpayPayment.paymentUrl;
        } else {
          message.error("Không thể tạo link thanh toán VNPay!");
        }
        return;
      }

      let orderForReceipt: Order;

      if (draftOrder && (draftOrder.status || "").toLowerCase() === "pending") {
        const idForUpdate =
          draftOrder.orderId ?? (draftOrder as any).OrderId ?? draftOrder.id;

        if (!idForUpdate) {
          throw new Error("Không xác định được mã hóa đơn để cập nhật.");
        }

        await posApi.updateOrder(idForUpdate, {
          status: "paid",
          paymentMethod,
        });

        orderForReceipt = {
          ...draftOrder,
          status: "paid",
        };
      } else {
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
          status: "paid" as const,
        };

        const createdOrder = await posApi.createFullOrder(payload);
        orderForReceipt = createdOrder;
      }

      message.destroy();
      message.success("Thanh toán thành công!");

      resetPos();
    } catch (err: any) {
      message.destroy();
      console.error("Lỗi thanh toán:", err);
      console.error("Error response:", err.response?.data);
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

  const displayedProducts = useMemo(() => {
    let items = allProducts.slice();

    const q = productQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      );
    }

    if (selectedCategoryId && selectedCategoryId !== 0) {
      items = items.filter((p) => p.categoryId === selectedCategoryId);
    }

    if (stockFilter === "in") {
      items = items.filter(
        (p) => (p.currentStock ?? p.inventory?.quantity ?? 0) > 0
      );
    } else if (stockFilter === "out") {
      items = items.filter(
        (p) => (p.currentStock ?? p.inventory?.quantity ?? 0) <= 0
      );
    }

    if (minPrice !== null) {
      items = items.filter((p) => (p.price ?? 0) >= minPrice);
    }
    if (maxPrice !== null) {
      items = items.filter((p) => (p.price ?? 0) <= maxPrice);
    }

    return items;
  }, [
    allProducts,
    productQuery,
    selectedCategoryId,
    stockFilter,
    minPrice,
    maxPrice,
  ]);

  const slicedProducts = useMemo(
    () => displayedProducts.slice(0, gridLimit),
    [displayedProducts, gridLimit]
  );

  useEffect(() => {
    setGridLimit(30);
  }, [selectedCategoryId, stockFilter, minPrice, maxPrice]);

  useEffect(() => {
    const generatePdf = async () => {
      if (!printData || !printAreaRef.current) return;

      try {
        const canvas = await html2canvas(printAreaRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            const all = clonedDoc.querySelectorAll<HTMLElement>("*");
            all.forEach((el) => {
              const style = clonedDoc.defaultView?.getComputedStyle(el);
              if (!style) return;

              const bg = style.backgroundColor || "";
              const color = style.color || "";

              if (bg.includes("oklch(")) {
                el.style.backgroundColor = "#ffffff";
              }
              if (color.includes("oklch(")) {
                el.style.color = "#000000";
              }
            });
          },
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();

        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        const orderIdText =
          printData.order.orderId ??
          (printData.order as any).OrderId ??
          printData.order.id;

        pdf.save(`hoa_don_${orderIdText || Date.now()}.pdf`);
      } catch (error) {
        console.error("Lỗi khi tạo PDF hóa đơn:", error);
        message.error("Không thể tạo file PDF hóa đơn!");
      } finally {
        setPrintData(null);
      }
    };

    generatePdf();
  }, [printData, message]);

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row gutter={24}>
          {/* LEFT: products & cart */}
          <Col xs={24} md={15}>
            <Title level={4}>Bán hàng (POS)</Title>

            {/* Search + actions */}
            <Space style={{ marginBottom: 12 }}>
              <Input
                id="product-search"
                placeholder="Nhập tên sản phẩm"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                style={{ width: 320 }}
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
              <Button
                type="default"
                onClick={() => {
                  setScanMode("product"); // Set mode quét sản phẩm
                  setScannerOpen(true);
                }}
                icon={<SearchOutlined />}
              >
                Quét mã
              </Button>
            </Space>

            {/* Row with dropdown + price filters */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Select
                placeholder="Chọn danh mục"
                style={{ minWidth: 220 }}
                value={
                  selectedCategoryId === 0 ? undefined : selectedCategoryId
                }
                onChange={(v) => setSelectedCategoryId(Number(v) ?? 0)}
                allowClear
              >
                <Option key="all" value={0}>
                  Tất cả
                </Option>
                {categories.map((c) => (
                  <Option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName ?? `Category ${c.categoryId}`}
                  </Option>
                ))}
              </Select>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <InputNumber
                  placeholder="Giá từ"
                  min={0}
                  style={{ width: 120 }}
                  value={minPrice ?? undefined}
                  onChange={(v) =>
                    setMinPrice(
                      v === null || v === undefined ? null : Number(v)
                    )
                  }
                />
                <InputNumber
                  placeholder="Đến"
                  min={0}
                  style={{ width: 120 }}
                  value={maxPrice ?? undefined}
                  onChange={(v) =>
                    setMaxPrice(
                      v === null || v === undefined ? null : Number(v)
                    )
                  }
                />
                <Button
                  type="primary"
                  onClick={() => {
                    // reset filters quickly
                    setSelectedCategoryId(0);
                    setStockFilter("all");
                    setMinPrice(null);
                    setMaxPrice(null);
                    setProductQuery("");
                    setGridLimit(30);
                  }}
                >
                  RESET
                </Button>
              </div>
            </div>

            <Divider />

            <Title level={5}>Danh sách sản phẩm</Title>

            <div
              style={{
                maxHeight: "420px",
                overflowY: "auto",
                paddingBottom: "10px",
                background: "#f9f9f9",
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
              }}
            >
              <Spin spinning={loadingProducts}>
                <div style={{ padding: 16 }}>
                  {/* Grid container: responsive */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_CARD_WIDTH}px, 1fr))`,
                      gap: 16,
                    }}
                  >
                    {slicedProducts.length > 0 ? (
                      slicedProducts.map((p) => {
                        const stock =
                          p.currentStock ?? p.inventory?.quantity ?? 0;
                        const isOutOfStock = stock <= 0;
                        const imgUrl = getImageUrl(p.imageUrl, p.image);

                        return (
                          <div
                            key={p.productId}
                            onClick={() => !isOutOfStock && addProductToCart(p)}
                            style={{
                              cursor: isOutOfStock ? "not-allowed" : "pointer",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: isOutOfStock
                                ? "1px solid #ffccc7"
                                : "1px solid #e8e8e8",
                              background: "#fff",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              transition:
                                "transform 120ms ease, box-shadow 120ms ease",
                              display: "flex",
                              flexDirection: "column",
                              height: 260,
                              opacity: isOutOfStock ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.transform = "translateY(-4px)";
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.transform = "translateY(0)";
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
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
                                style={{ color: "#1890ff", fontWeight: 700 }}
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
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: 12 }}>
                        <Text type="secondary">
                          Không tìm thấy sản phẩm nào.
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Load more if items exceed limit */}
                  {displayedProducts.length > gridLimit && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <Button onClick={() => setGridLimit((prev) => prev + 30)}>
                        Xem thêm
                      </Button>
                    </div>
                  )}

                  {/* If no items at all */}
                  {displayedProducts.length === 0 && !loadingProducts && (
                    <div style={{ padding: 12 }}>
                      <Text type="secondary">Không có sản phẩm phù hợp.</Text>
                    </div>
                  )}
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

          {/* RIGHT: payment/card */}
          <Col xs={24} md={9}>
            <Card style={{ position: "sticky", top: 24 }}>
              <Title level={5}>Khách hàng</Title>
              {/* Sửa phần chọn khách hàng để thêm nút quét QR */}
              <div style={{ display: "flex", gap: 8 }}>
                <Select
                  style={{ flex: 1 }}
                  placeholder="Chọn khách hàng"
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
                <Button
                    icon={<QrcodeOutlined />}
                    onClick={() => {
                        setScanMode("customer"); // Chế độ quét khách hàng
                        setScannerOpen(true);
                    }}
                    title="Quét QR khách hàng"
                />
              </div>

              <Divider />
              <Title level={5}>
                <TagOutlined /> Khuyến mãi
              </Title>
              <Space.Compact style={{ width: "100%" }}>
                <AutoComplete
                  style={{ flex: 1 }}
                  value={promoCode}
                  onChange={(value) => setPromoCode(value)}
                  onSelect={(value) => {
                    setPromoCode(value);
                    applyPromotion(value);
                  }}
                  disabled={cart.length === 0}
                  options={availablePromotions.map((promo) => {
                    const discountText =
                      promo.discount_type === "percent" ||
                      promo.discount_type === "percentage"
                        ? `${promo.discount_value}%`
                        : formatCurrency(promo.discount_value);
                    const minOrderText =
                      promo.min_order_amount > 0
                        ? ` (Đơn tối thiểu: ${formatCurrency(
                            promo.min_order_amount
                          )})`
                        : "";

                    return {
                      value: promo.promo_code,
                      label: (
                        <div>
                          <div style={{ fontWeight: "bold" }}>
                            {promo.promo_code}
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            {promo.description} - Giảm {discountText}
                            {minOrderText}
                          </div>
                        </div>
                      ),
                    };
                  })}
                  notFoundContent={
                    loadingPromotions ? (
                      <Spin size="small" />
                    ) : availablePromotions.length === 0 ? (
                      "Không có mã khuyến mãi khả dụng"
                    ) : null
                  }
                >
                  <Input
                    prefix={<TagOutlined />}
                    placeholder="Nhập hoặc chọn mã khuyến mãi"
                    allowClear
                    onPressEnter={() => applyPromotion()}
                  />
                </AutoComplete>
                <Button
                  type="primary"
                  onClick={() => applyPromotion()}
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
                      setPaymentMethod(
                        v as "cash" | "card" | "transfer" | "momo" | "vnpay"
                      )
                    }
                    style={{ width: "100%" }}
                  >
                    <Option value="cash">Tiền mặt</Option>
                    <Option value="momo">MoMo</Option>
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
                <Space
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="large"
                    onClick={handlePrintInvoice}
                    disabled={cart.length === 0 || loadingCheckout}
                    loading={loadingCheckout && !paymentModalOpen}
                  >
                    In hóa đơn
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setPaymentModalOpen(true)}
                    disabled={cart.length === 0 || loadingCheckout}
                    loading={loadingCheckout && paymentModalOpen}
                  >
                    Xác nhận & Thanh toán
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Payment confirm modal */}
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
            : paymentMethod === "transfer"
            ? "Chuyển khoản"
            : paymentMethod === "momo"
            ? "MoMo"
            : paymentMethod === "vnpay"
            ? "VNPay"
            : "N/A"}
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

      {/* Scanner modal */}
      <Modal
        open={scannerOpen}
        title={scanMode === 'product' ? "Quét mã vạch sản phẩm" : "Quét mã QR khách hàng"}
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
              <Spin tip={scanMode === 'product' ? "Đang quét sản phẩm..." : "Đang tìm số điện thoại..."} />
            ) : (
              <Button onClick={() => setScannerOpen(false)}>Đóng</Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Hidden invoice layout for PDF generation */}
      <div
        id="pos-print-area"
        ref={printAreaRef}
        style={{
          position: "fixed",
          top: -10000,
          left: -10000,
          width: "800px",
          padding: "24px",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {printData && (
          <div>
            {/* Header with logo R and title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#1677ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  R
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    Chi tiết hóa đơn #{printData.order.orderId}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Hệ thống bán lẻ SGU-Net
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {new Date().toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

            {/* Order info table (similar to OrdersList modal, without status) */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      width: "25%",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Mã hóa đơn
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      width: "25%",
                    }}
                  >
                    #{printData.order.orderId}
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      width: "25%",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Ngày tạo
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      width: "25%",
                    }}
                  >
                    {new Date(
                      (printData.order as any).orderDate ||
                        (printData.order as any).OrderDate ||
                        printData.order.createdAt ||
                        new Date().toISOString()
                    ).toLocaleString("vi-VN")}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Khách hàng
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                    }}
                  >
                    {printData.customer?.customerName ||
                      printData.customer?.name ||
                      "Khách vãng lai"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Nhân viên
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                    }}
                  >
                    {user?.full_name || user?.username || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Khuyến mãi
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                    }}
                  >
                    {appliedPromotion?.promoCode || "Không có"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                      background: "#fafafa",
                      fontWeight: 600,
                    }}
                  >
                    Phương thức
                  </td>
                  <td
                    style={{
                      border: "1px solid #f0f0f0",
                      padding: "8px 12px",
                    }}
                  >
                    {getPaymentMethodText(printData.paymentMethod)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Products table */}
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Sản phẩm
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #f0f0f0",
                        padding: "8px 8px",
                        textAlign: "left",
                        background: "#1677ff",
                        color: "#fff",
                      }}
                    >
                      Sản phẩm
                    </th>
                    <th
                      style={{
                        border: "1px solid #f0f0f0",
                        padding: "8px 8px",
                        textAlign: "center",
                        width: "10%",
                        background: "#1677ff",
                        color: "#fff",
                      }}
                    >
                      SL
                    </th>
                    <th
                      style={{
                        border: "1px solid #f0f0f0",
                        padding: "8px 8px",
                        textAlign: "right",
                        width: "20%",
                        background: "#1677ff",
                        color: "#fff",
                      }}
                    >
                      Đơn giá
                    </th>
                    <th
                      style={{
                        border: "1px solid #f0f0f0",
                        padding: "8px 8px",
                        textAlign: "right",
                        width: "20%",
                        background: "#1677ff",
                        color: "#fff",
                      }}
                    >
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item) => (
                    <tr key={item.productId}>
                      <td
                        style={{
                          border: "1px solid #f0f0f0",
                          padding: "6px 8px",
                        }}
                      >
                        {item.productName}
                      </td>
                      <td
                        style={{
                          border: "1px solid #f0f0f0",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          border: "1px solid #f0f0f0",
                          padding: "6px 8px",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(item.price)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #f0f0f0",
                          padding: "6px 8px",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary and payment info */}
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  maxWidth: 360,
                  marginLeft: "auto",
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span>Tổng tiền hàng:</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatCurrency(
                      printData.items.reduce(
                        (sum, i) => sum + i.price * i.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    color: "#ff4d4f",
                  }}
                >
                  <span>Giảm giá:</span>
                  <span style={{ fontWeight: 600 }}>
                    - {formatCurrency(printData.discountAmount || 0)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #f0f0f0",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#52c41a",
                  }}
                >
                  <span>Thành tiền:</span>
                  <span>{formatCurrency(printData.totalAmount)}</span>
                </div>

                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>Khách đưa:</span>
                    <span>{formatCurrency(printData.cash)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Tiền thối lại:</span>
                    <span>
                      {formatCurrency(
                        Math.max(printData.cash - printData.totalAmount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 32,
                textAlign: "center",
                fontSize: 11,
                color: "#888",
              }}
            >
              Cảm ơn quý khách đã mua hàng!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PosPage: React.FC = () => (
  <App>
    <PosPageInternal />
  </App>
);

export default PosPage;