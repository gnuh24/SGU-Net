
using be_retail.lib.VNPAY_CS_ASPX;
using be_retail.DTOs;
using be_retail.Repositories;

namespace be_retail.Services
{
    public class VnPayService
    {
        private readonly string _vnpTmnCode;
        private readonly string _vnpHashSecret;
        private readonly string _vnpReturnUrl;
        private readonly string _vnpUrl;
        private readonly OrderRepository _orderRepository;

        public VnPayService(OrderRepository orderRepository, string vnpTmnCode, string vnpHashSecret, string vnpReturnUrl, string vnpUrl)
        {
            _orderRepository = orderRepository;
            _vnpTmnCode = vnpTmnCode;
            _vnpHashSecret = vnpHashSecret;
            _vnpReturnUrl = vnpReturnUrl;
            _vnpUrl = vnpUrl;
        }

        public string CreatePaymentUrl(OrderResponseDTO order)
        {
            var vnpay = new VnPayLibrary();

            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", _vnpTmnCode);
            vnpay.AddRequestData("vnp_Amount", ((long)(order.Payment.Amount * 100)).ToString()); // VND * 100
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_TxnRef", order.OrderId.ToString());
            vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toán đơn hàng {order.OrderId}");
            vnpay.AddRequestData("vnp_OrderType", "1904");
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_ReturnUrl", _vnpReturnUrl);
            vnpay.AddRequestData("vnp_CreateDate", DateTime.UtcNow.ToString("yyyyMMddHHmmss"));

            // Có thể thêm bankCode nếu muốn
            // vnpay.AddRequestData("vnp_BankCode", "NCB");

            var paymentUrl = vnpay.CreateRequestUrl(_vnpUrl, _vnpHashSecret);
            return paymentUrl;
        }

        public async Task<VnPayIpnResult> HandleVnPayIpnAsync(IQueryCollection query)
        {
            var result = new VnPayIpnResult();

            // không có query
            if (!query.Any())
                return new VnPayIpnResult { RspCode = "99", Message = "Input data required" };

            var vnp = new VnPayLibrary();

            foreach (var key in query.Keys)
                if (key.StartsWith("vnp_"))
                    vnp.AddResponseData(key, query[key]);

            // Verify signature
            var vnpSecureHash = query["vnp_SecureHash"];
            if (!vnp.ValidateSignature(vnpSecureHash, _vnpHashSecret))
                return new VnPayIpnResult { RspCode = "97", Message = "Invalid signature" };

            // Order Id
            var orderIdStr = vnp.GetResponseData("vnp_TxnRef");
            if (!int.TryParse(orderIdStr, out var orderId))
                return new VnPayIpnResult { RspCode = "01", Message = "Order not found" };

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                return new VnPayIpnResult { RspCode = "01", Message = "Order not found" };

            // Amount check
            var amountVnp = decimal.Parse(vnp.GetResponseData("vnp_Amount")) / 100;
            if (order.Payment.Amount != amountVnp)
                return new VnPayIpnResult { RspCode = "04", Message = "Invalid amount" };

            // Already processed
            if (order.Status != "pending")
                return new VnPayIpnResult { RspCode = "02", Message = "Order already confirmed" };

            // Payment status
            var respCode = vnp.GetResponseData("vnp_ResponseCode");
            var transStatus = vnp.GetResponseData("vnp_TransactionStatus");

            if (respCode == "00" && transStatus == "00")
            {
                order.Status = "paid";
                order.Payment.PaymentTranId = long.Parse(vnp.GetResponseData("vnp_TransactionNo"));
            }

            return new VnPayIpnResult { RspCode = "00", Message = "Confirm Success" };
        }
    }
}