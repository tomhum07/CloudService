using Microsoft.AspNetCore.Http;
using System;
using System.Diagnostics;
using System.Security.Claims;
using System.Threading.Tasks;
using Serilog;

namespace CloudService.WebApi.Middlewares
{
    public class SerilogAuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public SerilogAuditLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "";
            
            // Bỏ qua các static file và swagger docs để log gọn gàng
            if (path.StartsWith("/swagger") || path.StartsWith("/scalar") || path.StartsWith("/favicon.ico") || path == "/")
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();
                var duration = stopwatch.ElapsedMilliseconds;
                var statusCode = context.Response.StatusCode;
                var method = context.Request.Method;

                // 1. Trích xuất User và Role
                string userDisplay = "Khách (N/A)";
                if (context.User.Identity?.IsAuthenticated == true)
                {
                    var username = context.User.Identity.Name 
                        ?? context.User.FindFirst(ClaimTypes.Name)?.Value 
                        ?? "User";
                    var role = context.User.FindFirst(ClaimTypes.Role)?.Value 
                        ?? context.User.FindFirst("role")?.Value 
                        ?? "Customer";
                    userDisplay = $"{username} ({role})";
                }

                // 2. Lấy IP
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                if (ip == "::1") ip = "127.0.0.1";

                // 3. Phân giải hành động tiếng Việt
                var action = ResolveAction(method, path);

                // 4. Xuất log ngắn gọn trên 1 dòng duy nhất, không bị rớt dòng (Clean Single-Line Log)
                if (method == "GET" || method == "OPTIONS")
                {
                    // Đối với request truy vấn (GET / OPTIONS): hiển thị siêu gọn
                    if (statusCode >= 400)
                    {
                        Log.Warning("[{Method} {Status}] {Path} ({Duration}ms) | {User} | IP: {IP}", method, statusCode, path, duration, userDisplay, ip);
                    }
                    else
                    {
                        Log.Information("[{Method} {Status}] {Path} ({Duration}ms) | {User} | IP: {IP}", method, statusCode, path, duration, userDisplay, ip);
                    }
                }
                else
                {
                    // Đối với thao tác nghiệp vụ (POST, PUT, DELETE, PATCH): hiển thị rõ hành động
                    if (statusCode >= 500)
                    {
                        Log.Error("[{Method} {Status}] {Action} -> {Path} ({Duration}ms) | {User} | IP: {IP}", method, statusCode, action, path, duration, userDisplay, ip);
                    }
                    else if (statusCode >= 400)
                    {
                        Log.Warning("[{Method} {Status}] {Action} -> {Path} ({Duration}ms) | {User} | IP: {IP}", method, statusCode, action, path, duration, userDisplay, ip);
                    }
                    else
                    {
                        Log.Information("[{Method} {Status}] {Action} -> {Path} ({Duration}ms) | {User} | IP: {IP}", method, statusCode, action, path, duration, userDisplay, ip);
                    }
                }
            }
        }

        private static string ResolveAction(string method, string path)
        {
            var p = path.ToLower();

            // Bảo mật & Tài khoản
            if (p.Contains("/api/auth/login")) return "Đăng nhập hệ thống";
            if (p.Contains("/api/auth/refresh-token")) return "Làm mới Token";
            if (p.Contains("/api/auth/logout")) return "Đăng xuất";
            if (p.Contains("/api/auth/change-password")) return "Đổi mật khẩu";
            if (p.Contains("/api/auth/register")) return "Đăng ký tài khoản";
            if (p.Contains("/api/auth/forgot-password") || p.Contains("/api/auth/reset-password")) return "Khôi phục mật khẩu";
            if (p.Contains("/api/auth/profile")) return "Cập nhật hồ sơ";
            if (p.Contains("/api/admin/users")) return $"{method} Quản lý tài khoản";

            // Gói cước & Bảng giá
            if (p.Contains("/qr-code")) return "Tạo/Xem mã QR";
            if (p.Contains("/prices")) return $"{method} Bảng giá";
            if (p.Contains("/api/service-plans")) return $"{method} Gói dịch vụ";
            if (p.Contains("/api/service-categories")) return $"{method} Danh mục";
            if (p.Contains("/api/promotions")) return $"{method} Khuyến mãi";

            // Đơn hàng & Thanh toán
            if (p.Contains("/api/order-requests/export")) return "Xuất Excel/CSV";
            if (p.Contains("/api/order-requests")) return $"{method} Đơn hàng";
            if (p.Contains("/api/payment")) return "Thanh toán PayOS";
            if (p.Contains("/api/affiliates")) return $"{method} Affiliate CTV";

            // Tin tức & CMS
            if (p.Contains("/api/news")) return $"{method} Tin tức";
            if (p.Contains("/api/statistics")) return "Thống kê";
            if (p.Contains("/api/admin/audit-logs")) return "Truy vấn AuditLog";

            return $"{method} {path}";
        }
    }
}
