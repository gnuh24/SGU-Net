using System.Security.Cryptography;
using System.Text;
using System.Linq;
using be_retail.DTOs;
using Microsoft.Extensions.Configuration;

namespace be_retail.Services
{
    public class VNPayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<VNPayService> _logger;

        private string TmnCode => _configuration["VNPay:TmnCode"] ?? "";
        private string HashSecret => _configuration["VNPay:HashSecret"] ?? "";
        private string PaymentUrl => _configuration["VNPay:PaymentUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        private string ReturnUrl => _configuration["VNPay:ReturnUrl"] ?? "";
        private string IpnUrl => _configuration["VNPay:IpnUrl"] ?? "";

        public VNPayService(
            IConfiguration configuration,
            ILogger<VNPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Tạo payment URL cho VNPay
        /// </summary>
        public string CreatePaymentUrl(
            string orderId,
            decimal amount,
            string orderInfo,
            string? returnUrl = null)
        {
            try
            {
                // VNPay yêu cầu amount * 100 và phải là số nguyên
                var vnp_Amount = ((long)Math.Round(amount * 100)).ToString();
                // OrderInfo cần được xử lý đúng
                var vnp_OrderInfo = orderInfo ?? $"Thanh toan don hang #{orderId}";
                var vnp_OrderType = "other";
                var vnp_TxnRef = orderId;
                var vnp_CreateDate = DateTime.Now.ToString("yyyyMMddHHmmss");
                var vnp_ExpireDate = DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss");
                var vnp_IpAddr = "127.0.0.1";
                var vnp_ReturnUrl = returnUrl ?? ReturnUrl;

                var vnp_Params = new SortedDictionary<string, string>
                {
                    { "vnp_Version", "2.1.0" },
                    { "vnp_Command", "pay" },
                    { "vnp_TmnCode", TmnCode },
                    { "vnp_Amount", vnp_Amount },
                    { "vnp_CurrCode", "VND" },
                    { "vnp_TxnRef", vnp_TxnRef },
                    { "vnp_OrderInfo", vnp_OrderInfo },
                    { "vnp_OrderType", vnp_OrderType },
                    { "vnp_Locale", "vn" },
                    { "vnp_ReturnUrl", vnp_ReturnUrl },
                    { "vnp_IpAddr", vnp_IpAddr },
                    { "vnp_CreateDate", vnp_CreateDate },
                    { "vnp_ExpireDate", vnp_ExpireDate }
                };

                // Thêm IpnUrl nếu có và không phải localhost (VNPay không chấp nhận localhost)
                if (!string.IsNullOrEmpty(IpnUrl) && !IpnUrl.Contains("localhost"))
                {
                    vnp_Params.Add("vnp_IpnUrl", IpnUrl);
                }

                // Loại bỏ các tham số có giá trị rỗng trước khi tính hash
                var validParams = vnp_Params.Where(kvp => !string.IsNullOrEmpty(kvp.Value))
                                           .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
                
                // Tạo query string (KHÔNG encode khi tính hash, theo thứ tự key)
                // Format: key=value&key=value (không có khoảng trắng, không encode)
                var queryString = string.Join("&", validParams.Select(kvp => $"{kvp.Key}={kvp.Value}"));

                // Tạo hash từ query string chưa encode
                var vnp_SecureHash = ComputeHmacSha512(HashSecret, queryString);
                
                // Log để debug
                _logger.LogInformation($"VNPay Query String (for hash): {queryString}");
                _logger.LogInformation($"VNPay Secure Hash: {vnp_SecureHash}");
                _logger.LogInformation($"VNPay TmnCode: {TmnCode}");
                _logger.LogInformation($"VNPay Amount: {vnp_Amount}");
                
                // Tạo query string đã encode cho URL (giữ nguyên thứ tự, chỉ encode value)
                var encodedQueryString = string.Join("&", validParams.Select(kvp => $"{kvp.Key}={Uri.EscapeDataString(kvp.Value)}"));

                // Thêm hash vào query string (hash không cần encode)
                var paymentUrl = $"{PaymentUrl}?{encodedQueryString}&vnp_SecureHash={vnp_SecureHash}";

                _logger.LogInformation($"VNPay payment URL created for order {orderId}");
                _logger.LogInformation($"VNPay Payment URL (first 200 chars): {paymentUrl.Substring(0, Math.Min(200, paymentUrl.Length))}...");
                return paymentUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment URL");
                throw;
            }
        }

        /// <summary>
        /// Verify signature từ VNPay callback
        /// </summary>
        public bool VerifySignature(VNPayCallbackRequest callback)
        {
            try
            {
                // Tạo lại query string từ callback (không bao gồm vnp_SecureHash)
                var vnp_Params = new SortedDictionary<string, string>
                {
                    { "vnp_TmnCode", callback.vnp_TmnCode },
                    { "vnp_Amount", callback.vnp_Amount },
                    { "vnp_BankCode", callback.vnp_BankCode },
                    { "vnp_BankTranNo", callback.vnp_BankTranNo },
                    { "vnp_CardType", callback.vnp_CardType },
                    { "vnp_PayDate", callback.vnp_PayDate },
                    { "vnp_OrderInfo", callback.vnp_OrderInfo },
                    { "vnp_TransactionNo", callback.vnp_TransactionNo },
                    { "vnp_ResponseCode", callback.vnp_ResponseCode },
                    { "vnp_TransactionStatus", callback.vnp_TransactionStatus },
                    { "vnp_TxnRef", callback.vnp_TxnRef }
                };

                // Loại bỏ các field rỗng
                vnp_Params = new SortedDictionary<string, string>(
                    vnp_Params.Where(kvp => !string.IsNullOrEmpty(kvp.Value))
                              .ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
                );

                // Query string để tính hash KHÔNG encode (giống như khi tạo payment URL)
                var queryString = string.Join("&", vnp_Params.Select(kvp => $"{kvp.Key}={kvp.Value}"));
                var vnp_SecureHash = ComputeHmacSha512(HashSecret, queryString);
                
                _logger.LogInformation($"VNPay Verify - Query String: {queryString}");
                _logger.LogInformation($"VNPay Verify - Computed Hash: {vnp_SecureHash}");
                _logger.LogInformation($"VNPay Verify - Received Hash: {callback.vnp_SecureHash}");

                return vnp_SecureHash.Equals(callback.vnp_SecureHash, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying VNPay signature");
                return false;
            }
        }

        /// <summary>
        /// Compute HMAC SHA512
        /// </summary>
        private string ComputeHmacSha512(string secretKey, string message)
        {
            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secretKey));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
            // VNPay yêu cầu hash phải uppercase
            return BitConverter.ToString(hashBytes).Replace("-", "").ToUpper();
        }
    }
}

