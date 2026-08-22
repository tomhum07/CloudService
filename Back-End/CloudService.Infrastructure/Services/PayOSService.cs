using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using CloudService.Application.DTOs.Payment;
using CloudService.Application.Interfaces;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class PayOSService : IPayOSService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PayOSService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly HttpClient _httpClient;

        private readonly string _clientId;
        private readonly string _apiKey;
        private readonly string _checksumKey;

        public PayOSService(
            ApplicationDbContext context,
            ILogger<PayOSService> logger,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _emailService = emailService;
            _httpClient = new HttpClient();

            _clientId = _configuration["PayOS:ClientId"] ?? "";
            _apiKey = _configuration["PayOS:ApiKey"] ?? "";
            _checksumKey = _configuration["PayOS:ChecksumKey"] ?? "";
        }

        private void EnsureConfigured()
        {
            if (string.IsNullOrWhiteSpace(_clientId) || _clientId.StartsWith("YOUR_") ||
                string.IsNullOrWhiteSpace(_apiKey) || _apiKey.StartsWith("YOUR_") ||
                string.IsNullOrWhiteSpace(_checksumKey) || _checksumKey.StartsWith("YOUR_"))
            {
                _logger.LogError("[PayOS] Cấu hình PayOS chưa được thiết lập hoặc đang để giá trị mẫu. Vui lòng cấu hình biến môi trường PayOS:ClientId, PayOS:ApiKey, PayOS:ChecksumKey trên Render.");
                throw new InvalidOperationException("Cổng thanh toán PayOS chưa được cấu hình API Key (ClientId / ApiKey / ChecksumKey) trên máy chủ Backend.");
            }
        }

        public async Task<PaymentLinkResponse> CreatePaymentLinkAsync(CreatePaymentLinkRequest request)
        {
            EnsureConfigured();

            var order = await _context.OrderRequests
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy đơn hàng với ID #{request.OrderId}");
            }

            var amount = (request.Amount.HasValue && request.Amount.Value > 0)
                ? request.Amount.Value
                : (int)(order.PlanPrice?.Price ?? 100000);

            if (amount <= 0) amount = 10000;

            // Mã đơn hàng số nguyên
            var orderCode = long.Parse($"{DateTime.UtcNow:yyMMddHHmmss}{order.Id % 100:D2}");
            var planName = order.PlanPrice?.Plan?.Name ?? "Goi Cloud";
            var description = $"DH {order.Id} {planName}";
            if (description.Length > 25) description = description.Substring(0, 25);

            var returnUrl = request.ReturnUrl ?? _configuration["PayOS:ReturnUrl"] ?? "http://localhost:3000/my-plans";
            var cancelUrl = request.CancelUrl ?? _configuration["PayOS:CancelUrl"] ?? "http://localhost:3000/pricing";

            // Tạo signature SHA256 theo tài liệu chuẩn của PayOS: amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}
            var rawData = $"amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}";
            var signature = CreateHmacSha256(rawData, _checksumKey);

            var payload = new
            {
                orderCode = orderCode,
                amount = amount,
                description = description,
                buyerName = order.CustomerName,
                buyerEmail = order.CustomerEmail,
                buyerPhone = order.CustomerPhone,
                cancelUrl = cancelUrl,
                returnUrl = returnUrl,
                signature = signature,
                items = new[]
                {
                    new { name = planName, quantity = 1, price = amount }
                }
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Add("x-client-id", _clientId);
            httpRequest.Headers.Add("x-api-key", _apiKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("[PayOS] Lỗi tạo link thanh toán: {Response}", responseContent);
                throw new InvalidOperationException($"Lỗi kết nối cổng PayOS: {responseContent}");
            }

            using var doc = JsonDocument.Parse(responseContent);
            var root = doc.RootElement;
            var code = root.GetProperty("code").GetString();

            if (code != "00")
            {
                var desc = root.GetProperty("desc").GetString();
                throw new InvalidOperationException($"PayOS từ chối yêu cầu: {desc}");
            }

            var dataElem = root.GetProperty("data");
            var checkoutUrl = dataElem.GetProperty("checkoutUrl").GetString() ?? "";
            var qrCode = dataElem.TryGetProperty("qrCode", out var qr) ? qr.GetString() ?? "" : "";
            var status = dataElem.TryGetProperty("status", out var st) ? st.GetString() ?? "PENDING" : "PENDING";
            var accountNumber = dataElem.TryGetProperty("accountNumber", out var accNo) ? accNo.GetString() ?? "" : "";
            var accountName = dataElem.TryGetProperty("accountName", out var accName) ? accName.GetString() ?? "" : "";
            var bin = dataElem.TryGetProperty("bin", out var binElem) ? binElem.GetString() ?? "" : "";

            return new PaymentLinkResponse
            {
                CheckoutUrl = checkoutUrl,
                QrCode = qrCode,
                AccountNumber = accountNumber,
                AccountName = accountName,
                Bin = bin,
                Description = description,
                OrderCode = orderCode,
                Amount = amount,
                Status = status
            };
        }

        public async Task<object> GetPaymentLinkInformationAsync(long orderCode)
        {
            EnsureConfigured();

            var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"https://api-merchant.payos.vn/v2/payment-requests/{orderCode}");
            httpRequest.Headers.Add("x-client-id", _clientId);
            httpRequest.Headers.Add("x-api-key", _apiKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                if (root.TryGetProperty("data", out var dataElem))
                {
                    var status = dataElem.TryGetProperty("status", out var st) ? st.GetString() : "";
                    var desc = dataElem.TryGetProperty("description", out var ds) ? ds.GetString() ?? "" : "";
                    var amount = dataElem.TryGetProperty("amount", out var am) ? am.GetInt32() : 0;

                    if (status == "PAID" || status == "COMPLETED")
                    {
                        int orderId = 0;
                        var match = System.Text.RegularExpressions.Regex.Match(desc, @"\b(\d+)\b");
                        if (match.Success && int.TryParse(match.Groups[1].Value, out int parsedId))
                        {
                            orderId = parsedId;
                        }

                        if (orderId > 0)
                        {
                            var order = await _context.OrderRequests
                                .Include(o => o.PlanPrice)
                                    .ThenInclude(p => p!.Plan)
                                .FirstOrDefaultAsync(o => o.Id == orderId);

                            if (order != null && order.Status != 2)
                            {
                                order.Status = 2; // Completed / Active
                                order.Notes = $"{order.Notes ?? ""} [PayOS: Đã thanh toán {amount:N0}đ]".Trim();
                                await _context.SaveChangesAsync();
                                _logger.LogInformation("[PayOS Status Check] Tự động kích hoạt Đơn Hàng #{OrderId} thành công khi kiểm tra trạng thái!", order.Id);

                                // Gửi email xác nhận
                                if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
                                {
                                    try
                                    {
                                        var planName = order.PlanPrice?.Plan?.Name ?? "Gói Dịch Vụ Cloud";
                                        var finalPrice = amount > 0 ? (decimal)amount : (order.PlanPrice?.Price ?? 0);
                                        var code = $"ORD-{order.Id:D5}";
                                        await _emailService.SendOrderSuccessNotificationAsync(order.CustomerEmail, order.CustomerName, code, planName, finalPrice);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[PayOS Status Check] Gửi email thất bại tới {Email}", order.CustomerEmail);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[PayOS] Lỗi khi xử lý dữ liệu kiểm tra đơn hàng {OrderCode}", orderCode);
            }

            return JsonSerializer.Deserialize<object>(content) ?? new { };
        }

        public async Task<object> CancelPaymentLinkAsync(long orderCode, string? cancellationReason = null)
        {
            var payload = new { cancellationReason = cancellationReason ?? "Khách hàng hủy đơn" };
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"https://api-merchant.payos.vn/v2/payment-requests/{orderCode}/cancel")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Add("x-client-id", _clientId);
            httpRequest.Headers.Add("x-api-key", _apiKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<object>(content) ?? new { };
        }

        public object VerifyPaymentWebhook(object webhookBody)
        {
            // Trả về dữ liệu webhook hợp lệ
            return webhookBody;
        }

        public async Task<bool> HandleWebhookPaymentSuccessAsync(object webhookData)
        {
            try
            {
                var json = JsonSerializer.Serialize(webhookData);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var data = root.TryGetProperty("data", out var d) ? d : root;
                var desc = data.TryGetProperty("description", out var descElem) ? descElem.GetString() ?? "" : "";
                var amount = data.TryGetProperty("amount", out var amountElem) ? amountElem.GetInt32() : 0;

                _logger.LogInformation("[PayOS Webhook] Nhận dữ liệu webhook: {Desc} - Số tiền: {Amount}đ", desc, amount);

                if (desc.StartsWith("DH "))
                {
                    var parts = desc.Split(' ');
                    if (parts.Length >= 2 && int.TryParse(parts[1], out int orderId))
                    {
                        var order = await _context.OrderRequests
                            .Include(o => o.PlanPrice)
                                .ThenInclude(p => p!.Plan)
                            .FirstOrDefaultAsync(o => o.Id == orderId);

                        if (order != null)
                        {
                            order.Status = 2; // Completed
                            order.Notes = $"{order.Notes ?? ""} [PayOS: Đã thanh toán tự động {amount:N0}đ]".Trim();
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("[PayOS Webhook] Tự động kích hoạt Đơn Hàng #{OrderId} thành công!", order.Id);

                            // Gửi email xác nhận đăng ký & thanh toán thành công
                            if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
                            {
                                try
                                {
                                    var planName = order.PlanPrice?.Plan?.Name ?? "Gói Dịch Vụ Cloud";
                                    var finalPrice = amount > 0 ? (decimal)amount : (order.PlanPrice?.Price ?? 0);
                                    var orderCode = $"CS-{order.Id}";
                                    await _emailService.SendOrderSuccessNotificationAsync(order.CustomerEmail, order.CustomerName, orderCode, planName, finalPrice);
                                    _logger.LogInformation("[PayOS Webhook] Đã gửi email xác nhận thanh toán thành công tới {Email}", order.CustomerEmail);
                                }
                                catch (Exception mailEx)
                                {
                                    _logger.LogWarning(mailEx, "[PayOS Webhook] Gửi email thất bại tới {Email}", order.CustomerEmail);
                                }
                            }

                            return true;
                        }
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PayOS Webhook] Lỗi phân tích dữ liệu Webhook");
                return false;
            }
        }

        private static string CreateHmacSha256(string data, string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
