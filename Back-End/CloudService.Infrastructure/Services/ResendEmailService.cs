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
            var subject = "[CloudService] Mã Xác Thực Đặt Lại Mật Khẩu Tài Khoản";
            var displayName = string.IsNullOrWhiteSpace(fullName) ? "Quý khách" : fullName;

            var html = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Mã Xác Thực OTP</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #f1f5f9; padding: 30px 10px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;'>
                            <div style='display: inline-block;'>
                                <h1 style='color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;'>
                                    Cloud<span style='color: #3b82f6;'>Service</span>
                                </h1>
                                <p style='color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0 0;'>
                                    Hạ Tầng Điện Toán Đám Mây Doanh Nghiệp
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style='padding: 36px 32px;'>
                            <p style='font-size: 15px; margin: 0 0 16px 0; color: #0f172a;'>
                                Kính gửi <strong>{displayName}</strong>,
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Hệ thống CloudService đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 24px 0; line-height: 1.6;'>
                                Quý khách vui lòng nhập mã xác thực OTP gồm 6 chữ số dưới đây vào trang khôi phục mật khẩu để tiếp tục:
                            </p>

                            <!-- OTP Box -->
                            <div style='background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;'>
                                <span style='font-family: ""Courier New"", Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;'>
                                    {otpCode}
                                </span>
                                <div style='font-size: 12px; color: #64748b; margin-top: 8px;'>
                                    Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>
                                </div>
                            </div>

                            <!-- Security Notice -->
                            <div style='background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin: 24px 0;'>
                                <p style='font-size: 12px; color: #92400e; margin: 0; line-height: 1.5;'>
                                    <strong>Lưu ý bảo mật:</strong> Tuyệt đối không cung cấp mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ của CloudService. Nếu Quý khách không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi để bảo vệ tài khoản.
                                </p>
                            </div>

                            <p style='font-size: 14px; color: #334155; margin: 28px 0 6px 0;'>
                                Trân trọng cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của CloudService.
                            </p>
                            <p style='font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;'>
                                Đội ngũ Chăm sóc Khách hàng & Bảo mật CloudService
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;'>
                            <p style='font-size: 12px; color: #64748b; margin: 0 0 6px 0;'>
                                <strong>CÔNG TY DỊCH VỤ ĐIỆN TOÁN ĐÁM MÂY CLOUDSERVICE VN</strong>
                            </p>
                            <p style='font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;'>
                                Tổng đài hỗ trợ 24/7: <a href='tel:19006868' style='color: #2563eb; text-decoration: none;'>1900 6868</a> | Email: <a href='mailto:support@cloudservice.vn' style='color: #2563eb; text-decoration: none;'>support@cloudservice.vn</a>
                            </p>
                            <p style='font-size: 11px; color: #cbd5e1; margin: 0;'>
                                © 2026 CloudService VN. Mọi quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendOrderSuccessNotificationAsync(string toEmail, string customerName, string orderCode, string planName, decimal price)
        {
            var subject = $"[CloudService] Xác Nhận Kích Hoạt Dịch Vụ Thành Công - Đơn Hàng #{orderCode}";
            var displayName = string.IsNullOrWhiteSpace(customerName) ? "Quý khách" : customerName;

            var html = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác Nhận Kích Hoạt Dịch Vụ</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #f1f5f9; padding: 30px 10px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;'>
                            <h1 style='color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;'>
                                Cloud<span style='color: #3b82f6;'>Service</span>
                            </h1>
                            <div style='display: inline-block; background-color: #064e3b; border: 1px solid #059669; border-radius: 20px; padding: 4px 14px; margin-top: 12px;'>
                                <span style='color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;'>
                                    ✓ Đã Thanh Toán & Kích Hoạt Thành Công
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style='padding: 36px 32px;'>
                            <p style='font-size: 15px; margin: 0 0 16px 0; color: #0f172a;'>
                                Kính gửi <strong>{displayName}</strong>,
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Ban Quản Trị CloudService xin trân trọng gửi lời cảm ơn sâu sắc tới Quý khách vì đã tin tưởng lựa chọn hạ tầng đám mây của chúng tôi.
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Chúng tôi xin thông báo đơn hàng của Quý khách đã được hệ thống xác nhận thanh toán thành công và hoàn tất kích hoạt với thông tin chi tiết như sau:
                            </p>

                            <!-- Order Details Table -->
                            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0;'>
                                <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>
                                    <tr>
                                        <td style='padding: 8px 0; color: #64748b;'>Mã Đơn Hàng:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: 700; color: #1d4ed8; font-family: monospace; font-size: 14px;'>{orderCode}</td>
                                    </tr>
                                    <tr style='border-top: 1px solid #e2e8f0;'>
                                        <td style='padding: 8px 0; color: #64748b;'>Gói Dịch Vụ:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;'>{planName}</td>
                                    </tr>
                                    <tr style='border-top: 1px solid #e2e8f0;'>
                                        <td style='padding: 8px 0; color: #64748b;'>Số Tiền Thanh Toán:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: 800; color: #059669; font-size: 15px;'>{price:N0} VNĐ</td>
                                    </tr>
                                    <tr style='border-top: 1px solid #e2e8f0;'>
                                        <td style='padding: 8px 0; color: #64748b;'>Trạng Thái:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: 700; color: #059669;'>Đang Hoạt Động (Active)</td>
                                    </tr>
                                    <tr style='border-top: 1px solid #e2e8f0;'>
                                        <td style='padding: 8px 0; color: #64748b;'>Thời Điểm Kích Hoạt:</td>
                                        <td style='padding: 8px 0; text-align: right; font-weight: 600; color: #475569;'>{DateTime.UtcNow.AddHours(7):dd/MM/yyyy HH:mm} (GMT+7)</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <div style='text-align: center; margin: 28px 0;'>
                                <a href='https://tomhum07.me/my-plans' style='display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);'>
                                    Truy Cập Trang Quản Lý Dịch Vụ →
                                </a>
                            </div>

                            <!-- Guidance Notice -->
                            <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 16px; margin: 24px 0;'>
                                <p style='font-size: 12px; color: #1e40af; margin: 0; line-height: 1.6;'>
                                    <strong>Hướng dẫn sử dụng:</strong> Quý khách có thể đăng nhập vào hệ thống tại <strong>tomhum07.me</strong>, chọn mục <strong>Gói Cước Của Tôi</strong> để quản lý cấu hình, gia hạn tự động hoặc gửi yêu cầu hỗ trợ kỹ thuật 24/7.
                                </p>
                            </div>

                            <p style='font-size: 14px; color: #334155; margin: 28px 0 6px 0;'>
                                Kính chúc Quý khách luôn có những trải nghiệm tuyệt vời và kinh doanh thuận lợi cùng CloudService.
                            </p>
                            <p style='font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;'>
                                Trân trọng cảm ơn,<br/>
                                Ban Quản Trị & Đội Ngũ Kỹ Thuật CloudService
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;'>
                            <p style='font-size: 12px; color: #64748b; margin: 0 0 6px 0;'>
                                <strong>CÔNG TY DỊCH VỤ ĐIỆN TOÁN ĐÁM MÂY CLOUDSERVICE VN</strong>
                            </p>
                            <p style='font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;'>
                                Tổng đài hỗ trợ 24/7: <a href='tel:19006868' style='color: #2563eb; text-decoration: none;'>1900 6868</a> | Email: <a href='mailto:support@cloudservice.vn' style='color: #2563eb; text-decoration: none;'>support@cloudservice.vn</a>
                            </p>
                            <p style='font-size: 11px; color: #cbd5e1; margin: 0;'>
                                © 2026 CloudService VN. Mọi quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendAffiliateApprovalNotificationAsync(string toEmail, string fullName)
        {
            var subject = "[CloudService] Chúc Mừng! Hồ Sơ Đối Tác Tiếp Thị (CTV) Của Bạn Đã Được Phê Duyệt";
            var displayName = string.IsNullOrWhiteSpace(fullName) ? "Quý đối tác" : fullName;

            var html = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Chúc Mừng Phê Duyệt Đối Tác</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #f1f5f9; padding: 30px 10px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;'>
                            <h1 style='color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;'>
                                Cloud<span style='color: #3b82f6;'>Service</span> Partner
                            </h1>
                            <div style='display: inline-block; background-color: #064e3b; border: 1px solid #059669; border-radius: 20px; padding: 4px 14px; margin-top: 12px;'>
                                <span style='color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;'>
                                    ✓ Hồ Sơ CTV Đã Được Phê Duyệt
                                </span>
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style='padding: 36px 32px;'>
                            <p style='font-size: 15px; margin: 0 0 16px 0; color: #0f172a;'>
                                Kính gửi <strong>{displayName}</strong>,
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Ban Phát Triển Đối Tác của CloudService rất vui mừng và vinh hạnh được chào đón Quý đối tác chính thức gia nhập mạng lưới <strong>Đối Tác Cộng Tác Viên (Affiliate Partner)</strong> của chúng tôi.
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Sau khi đánh giá hồ sơ đăng ký, chúng tôi nhận thấy tiềm năng hợp tác to lớn và đã tiến hành kích hoạt tài khoản đối tác của Quý vị với các chính sách ưu đãi đặc quyền:
                            </p>

                            <!-- Benefits Box -->
                            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;'>
                                <h4 style='margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 700;'>Quyền Lợi Dành Riêng Cho Quý Đối Tác:</h4>
                                <ul style='margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.8;'>
                                    <li><strong>Hoa hồng trọn đời:</strong> Hưởng mức chiết khấu lên đến <strong>20%</strong> trên mỗi đơn hàng gia hạn hoặc đăng ký mới.</li>
                                    <li><strong>Theo dõi minh bạch:</strong> Dashboard thống kê lưu lượng click, số lượng đơn hàng phát sinh thời gian thực.</li>
                                    <li><strong>Thanh toán nhanh chóng:</strong> Đối soát và thanh toán hoa hồng định kỳ vào ngày 15 hàng tháng qua tài khoản ngân hàng.</li>
                                    <li><strong>Hỗ trợ riêng 1-1:</strong> Đội ngũ quản lý đối tác hỗ trợ tư vấn tài liệu và tài nguyên truyền thông độc quyền.</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <div style='text-align: center; margin: 28px 0;'>
                                <a href='https://tomhum07.me/affiliate' style='display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);'>
                                    Truy Cập Cổng Thông Tin Đối Tác CTV →
                                </a>
                            </div>

                            <p style='font-size: 14px; color: #334155; margin: 28px 0 6px 0;'>
                                Đội ngũ hỗ trợ đối tác sẽ liên hệ trực tiếp qua Zalo / Số điện thoại của Quý vị trong vòng 24 giờ để gửi bộ tài liệu hướng dẫn và mã giới thiệu riêng.
                            </p>
                            <p style='font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;'>
                                Trân trọng cảm ơn và chúc Quý đối tác gặt hái nhiều thành công!<br/>
                                Ban Phát Triển Đối Tác CloudService
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;'>
                            <p style='font-size: 12px; color: #64748b; margin: 0 0 6px 0;'>
                                <strong>CHƯƠNG TRÌNH ĐỐI TÁC TIẾP THỊ CLOUDSERVICE AFFILIATE</strong>
                            </p>
                            <p style='font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;'>
                                Hỗ trợ Đối tác: <a href='mailto:affiliate@cloudservice.vn' style='color: #2563eb; text-decoration: none;'>affiliate@cloudservice.vn</a> | Hotline: <a href='tel:19006868' style='color: #2563eb; text-decoration: none;'>1900 6868</a>
                            </p>
                            <p style='font-size: 11px; color: #cbd5e1; margin: 0;'>
                                © 2026 CloudService VN. Mọi quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }

        public async Task<bool> SendAffiliateRejectionNotificationAsync(string toEmail, string fullName)
        {
            var subject = "[CloudService] Phản Hồi Về Hồ Sơ Đăng Ký Đối Tác Tiếp Thị (CTV)";
            var displayName = string.IsNullOrWhiteSpace(fullName) ? "Quý bạn" : fullName;

            var html = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Phản Hồi Đăng Ký Đối Tác</title>
</head>
<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #f1f5f9; padding: 30px 10px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;'>
                            <h1 style='color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;'>
                                Cloud<span style='color: #3b82f6;'>Service</span> Partner
                            </h1>
                            <p style='color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0 0;'>
                                Thông Báo Kết Quả Xét Duyệt Hồ Sơ
                            </p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style='padding: 36px 32px;'>
                            <p style='font-size: 15px; margin: 0 0 16px 0; color: #0f172a;'>
                                Kính gửi <strong>{displayName}</strong>,
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Lời đầu tiên, Ban Quản Trị CloudService xin chân thành cảm ơn sự quan tâm và thiện chí của Quý vị khi đăng ký tham gia chương trình <strong>Đối Tác Cộng Tác Viên (Affiliate Partner)</strong>.
                            </p>

                            <p style='font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.6;'>
                                Sau quá trình xem xét kỹ lưỡng dựa trên kế hoạch phát triển và tiêu chí tuyển chọn đối tác của giai đoạn hiện tại, chúng tôi rất tiếc phải thông báo rằng hồ sơ của Quý vị tạm thời chưa phù hợp với chương trình ở thời điểm này.
                            </p>

                            <!-- Notice Box -->
                            <div style='background-color: #f8fafc; border-left: 4px solid #94a3b8; border-radius: 6px; padding: 16px; margin: 24px 0;'>
                                <p style='font-size: 13px; color: #475569; margin: 0; line-height: 1.6;'>
                                    Quý vị hoàn toàn có thể cập nhật thêm thông tin về kênh tiếp thị, phương thức quảng bá và gửi lại hồ sơ đăng ký sau <strong>30 ngày</strong>. Chúng tôi luôn sẵn lòng chào đón và xem xét lại cơ hội hợp tác trong các giai đoạn tiếp theo.
                                </p>
                            </div>

                            <p style='font-size: 14px; color: #334155; margin: 28px 0 6px 0;'>
                                Kính chúc Quý vị luôn dồi dào sức khỏe và đạt nhiều thành tựu trong công việc.
                            </p>
                            <p style='font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;'>
                                Trân trọng cảm ơn,<br/>
                                Ban Phát Triển Đối Tác CloudService
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;'>
                            <p style='font-size: 12px; color: #64748b; margin: 0 0 6px 0;'>
                                <strong>CHƯƠNG TRÌNH ĐỐI TÁC TIẾP THỊ CLOUDSERVICE AFFILIATE</strong>
                            </p>
                            <p style='font-size: 11px; color: #94a3b8; margin: 0 0 8px 0;'>
                                Hỗ trợ: <a href='mailto:affiliate@cloudservice.vn' style='color: #2563eb; text-decoration: none;'>affiliate@cloudservice.vn</a> | Hotline: <a href='tel:19006868' style='color: #2563eb; text-decoration: none;'>1900 6868</a>
                            </p>
                            <p style='font-size: 11px; color: #cbd5e1; margin: 0;'>
                                © 2026 CloudService VN. Mọi quyền được bảo lưu.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, html);
        }
    }
}
