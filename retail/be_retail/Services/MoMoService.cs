using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using be_retail.DTOs;
using Microsoft.Extensions.Configuration;

namespace be_retail.Services
{
    public class MoMoService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<MoMoService> _logger;

        private string PartnerCode => _configuration["MoMo:PartnerCode"] ?? "";
        private string AccessKey => _configuration["MoMo:AccessKey"] ?? "";
        private string SecretKey => _configuration["MoMo:SecretKey"] ?? "";
        private string ApiEndpoint => _configuration["MoMo:ApiEndpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";
        private string ReturnUrl => _configuration["MoMo:ReturnUrl"] ?? "";
        private string NotifyUrl => _configuration["MoMo:NotifyUrl"] ?? "";

        public MoMoService(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            ILogger<MoMoService> logger)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<MoMoPaymentResponse> CreatePaymentAsync(
            string orderId,
            decimal amount,
            string orderInfo,
            string? returnUrl = null,
            string? notifyUrl = null)
        {
            try
            {
                var requestId = Guid.NewGuid().ToString();
                var extraData = "";
                var requestType = "captureWallet";
                
                var amountLong = (long)Math.Round(amount, 0);
                
                var ipnUrl = notifyUrl ?? NotifyUrl;
                var redirectUrl = returnUrl ?? ReturnUrl;

                var rawHash = $"accessKey={AccessKey}&amount={amountLong}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={PartnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";

                _logger.LogInformation($"MoMo Raw Hash for signature: {rawHash}");

                var signature = ComputeHmacSha256(rawHash, SecretKey);
                
                _logger.LogInformation($"MoMo Computed Signature: {signature}");

                var requestBody = new
                {
                    partnerCode = PartnerCode,
                    partnerName = "Retail Store",
                    storeId = "Store001",
                    requestId = requestId,
                    amount = amountLong,
                    orderId = orderId,
                    orderInfo = orderInfo, // Không encode trong body, chỉ encode trong signature
                    redirectUrl = returnUrl ?? ReturnUrl,
                    ipnUrl = notifyUrl ?? NotifyUrl,
                    lang = "vi",
                    extraData = extraData,
                    requestType = requestType,
                    autoCapture = true,
                    signature = signature
                };

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var jsonContent = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation($"MoMo Payment Request: {jsonContent}");

                var response = await httpClient.PostAsync(ApiEndpoint, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation($"MoMo Payment Response: {responseContent}");

                if (response.IsSuccessStatusCode)
                {
                    var momoResponse = JsonSerializer.Deserialize<MoMoPaymentResponse>(
                        responseContent,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (momoResponse != null && momoResponse.ResultCode == 0)
                    {
                        return momoResponse;
                    }
                    else
                    {
                        _logger.LogError($"MoMo API Error: {momoResponse?.Message ?? "Unknown error"}");
                        return new MoMoPaymentResponse
                        {
                            ResultCode = momoResponse?.ResultCode ?? -1,
                            Message = momoResponse?.Message ?? "Lỗi không xác định từ MoMo"
                        };
                    }
                }
                else
                {
                    _logger.LogError($"MoMo HTTP Error: {response.StatusCode} - {responseContent}");
                    return new MoMoPaymentResponse
                    {
                        ResultCode = -1,
                        Message = $"Lỗi kết nối MoMo: {response.StatusCode}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating MoMo payment");
                return new MoMoPaymentResponse
                {
                    ResultCode = -1,
                    Message = $"Lỗi hệ thống: {ex.Message}"
                };
            }
        }

        public bool VerifySignature(MoMoCallbackRequest callback)
        {
            try
            {
                var rawHash = $"accessKey={AccessKey}&amount={callback.Amount}&extraData={callback.ExtraData}&message={callback.Message}&orderId={callback.OrderId}&orderInfo={callback.OrderId}&partnerCode={callback.PartnerCode}&payType={callback.PayType}&requestId={callback.RequestId}&responseTime={callback.ResponseTime}&resultCode={callback.ResultCode}&transId={callback.TransId}";

                var signature = ComputeHmacSha256(rawHash, SecretKey);

                return signature.Equals(callback.Signature, StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying MoMo signature");
                return false;
            }
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(messageBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}

