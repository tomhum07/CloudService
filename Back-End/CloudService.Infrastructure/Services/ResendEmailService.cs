using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using CloudService.Application.Interfaces;
using Resend;

namespace CloudService.Infrastructure.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendEmailService> _logger;
        private static readonly System.Net.Http.HttpClient _httpClient = new System.Net.Http.HttpClient();

        public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var section = _configuration.GetSection("ResendClientOptions");
                var apiToken = section["Token"] ?? section["ApiToken"] ?? _configuration["ResendClientOptions:Token"] ?? _configuration["ResendClientOptions:ApiToken"] ?? section.Value;
                if (!string.IsNullOrWhiteSpace(apiToken))
                {
                    apiToken = apiToken.Trim();
                }
                var fromEmail = section["FromEmail"] ?? _configuration["ResendClientOptions:FromEmail"];

                if (string.IsNullOrWhiteSpace(fromEmail) || fromEmail.Contains("YOUR_DOMAIN"))
                {
                    fromEmail = "CLOUDSERVICES <noreply@tomhum07.me>";
                }

                if (string.IsNullOrWhiteSpace(apiToken))
                {
                    _logger.LogError("Resend API Token chưa được cấu hình.");
                    return false;
                }

                var payload = new
                {
                    from = fromEmail,
                    to = new[] { toEmail },
                    subject = subject,
                    html = htmlBody
                };

                using var request = new System.Net.Http.HttpRequestMessage(System.Net.Http.HttpMethod.Post, "https://api.resend.com/emails")
                {
                    Content = new System.Net.Http.StringContent(
                        System.Text.Json.JsonSerializer.Serialize(payload),
                        System.Text.Encoding.UTF8,
                        "application/json"
                    )
                };
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiToken);

                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Gửi email qua Resend thành công tới {ToEmail}. Response: {Response}", toEmail, responseContent);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Resend gửi thất bại tới {ToEmail}. StatusCode: {Code}, Response: {Response}", toEmail, response.StatusCode, responseContent);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ngoại lệ khi gửi email qua Resend tới {ToEmail}: {Message}", toEmail, ex.Message);
                return false;
            }
        }

        public async Task<bool> SendOtpResetPasswordAsync(string toEmail, string fullName, string otpCode)
        {
            var subject = "[CloudService] Mã OTP Đặt Lại Mật Khẩu";
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #3b82f6; font-size: 24px; margin: 0;'>CloudService</h1>
                        <p style='color: #94a3b8; font-size: 13px; margin-top: 4px;'>Hạ tầng Điện toán đám mây thế hệ mới</p>
                    </div>
                    
                    <p style='font-size: 14px; line-height: 1.6;'>Xin chào <strong>{fullName}</strong>,</p>
                    <p style='font-size: 14px; line-height: 1.6; color: #cbd5e1;'>
                        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại CloudService. 
                        Vui lòng sử dụng mã xác minh OTP bên dưới để tiếp tục:
                    </p>

                    <div style='background-color: #1e293b; border: 2px dashed #3b82f6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #60a5fa;'>{otpCode}</span>
                    </div>

                    <p style='font-size: 12px; color: #94a3b8; line-height: 1.5;'>
                        * Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.<br/>
                        * Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ.
                    </p>

                    <hr style='border: none; border-top: 1px solid #334155; margin: 24px 0;' />
                    <p style='font-size: 11px; color: #64748b; text-align: center; margin: 0;'>
                        © 2026 CloudService VN. All rights reserved.
                    </p>
                </div>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendOrderSuccessNotificationAsync(string toEmail, string customerName, string orderCode, string planName, decimal price)
        {
            var subject = $"[CloudService] Xác Nhận Đăng Ký & Thanh Toán Thành Công - Đơn #{orderCode}";
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;'>
                    <div style='text-align: center; margin-bottom: 24px;'>
                        <h1 style='color: #3b82f6; font-size: 24px; margin: 0;'>CloudService</h1>
                        <p style='color: #34d399; font-size: 14px; font-weight: bold; margin-top: 6px;'>✓ ĐĂNG KÝ & THANH TOÁN THÀNH CÔNG</p>
                    </div>

                    <p style='font-size: 14px;'>Xin chào <strong>{customerName}</strong>,</p>
                    <p style='font-size: 14px; color: #cbd5e1; line-height: 1.6;'>
                        Hệ thống CloudService đã ghi nhận thanh toán thành công và hoàn tất kích hoạt gói dịch vụ đám mây của bạn với chi tiết như sau:
                    </p>

                    <table style='width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;'>
                        <tr style='border-bottom: 1px solid #334155;'>
                            <td style='padding: 10px 0; color: #94a3b8;'>Mã đơn hàng:</td>
                            <td style='padding: 10px 0; text-align: right; font-weight: bold; color: #60a5fa;'>{orderCode}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #334155;'>
                            <td style='padding: 10px 0; color: #94a3b8;'>Gói cước:</td>
                            <td style='padding: 10px 0; text-align: right; font-weight: bold; color: #f8fafc;'>{planName}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #334155;'>
                            <td style='padding: 10px 0; color: #94a3b8;'>Số tiền đã thanh toán:</td>
                            <td style='padding: 10px 0; text-align: right; font-weight: bold; color: #34d399;'>{price:N0} VNĐ</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #334155;'>
                            <td style='padding: 10px 0; color: #94a3b8;'>Trạng thái dịch vụ:</td>
                            <td style='padding: 10px 0; text-align: right; font-weight: bold; color: #34d399;'>Đang Hoạt Động (Active)</td>
                        </tr>
                    </table>

                    <div style='background-color: #1e293b; border-left: 4px solid #3b82f6; padding: 14px; margin: 20px 0; font-size: 13px; color: #cbd5e1;'>
                        Bạn có thể đăng nhập vào website và truy cập trang <strong>Gói Cước Của Tôi (/my-plans)</strong> để quản lý thông số kỹ thuật, gia hạn hoặc liên hệ hỗ trợ kỹ thuật 24/7.
                    </div>

                    <hr style='border: none; border-top: 1px solid #334155; margin: 24px 0;' />
                    <p style='font-size: 11px; color: #64748b; text-align: center; margin: 0;'>
                        © 2026 CloudService VN. Hotline: 1900 6868 - Email: support@cloudservice.vn
                    </p>
                </div>";

            return await SendEmailAsync(toEmail, subject, html);
        }
    }
}
