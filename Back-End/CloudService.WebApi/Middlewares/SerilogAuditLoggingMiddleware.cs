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
            
            // Bỏ qua các static file swagger/scalar/favicon
            if (path.StartsWith("/swagger") || path.StartsWith("/scalar") || path.StartsWith("/favicon.ico"))
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
                string userDisplay = "Khách vãng lai (N/A)";
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

                // 2. Lấy địa chỉ IP
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                if (ip == "::1") ip = "127.0.0.1";

                // 3. Phân loại (Category) & Hành động (Action) dựa trên Path & Method
                var (category, action) = ResolveCategoryAndAction(method, path);

                // 4. Xuất log có cấu trúc chuẩn theo định dạng Serilog AuditLog
                var logTemplate = "[Serilog AuditLog] Phân loại={Category} | Hành động={Action} | User={User} | Method={Method} | Path={Path} | Status={Status} | Duration={Duration}ms | IP={IP}";

                if (statusCode >= 500)
                {
                    Log.Error(logTemplate, category, action, userDisplay, method, path, statusCode, duration, ip);
                }
                else if (statusCode >= 400)
                {
                    Log.Warning(logTemplate, category, action, userDisplay, method, path, statusCode, duration, ip);
                }
                else
                {
                    Log.Information(logTemplate, category, action, userDisplay, method, path, statusCode, duration, ip);
                }
            }
        }

        private static (string Category, string Action) ResolveCategoryAndAction(string method, string path)
        {
            var p = path.ToLower();

            // Phân hệ Bảo mật & Xác thực
            if (p.Contains("/api/auth/login")) return ("Bảo Mật", "Đăng nhập hệ thống");
            if (p.Contains("/api/auth/refresh-token")) return ("Bảo Mật", "Làm mới Token xác thực");
            if (p.Contains("/api/auth/logout")) return ("Bảo Mật", "Đăng xuất tài khoản");
            if (p.Contains("/api/auth/change-password")) return ("Bảo Mật", "Đổi mật khẩu tài khoản");
            if (p.Contains("/api/auth/register")) return ("Bảo Mật", "Đăng ký tài khoản mới");
            if (p.Contains("/api/auth/forgot-password") || p.Contains("/api/auth/reset-password")) return ("Bảo Mật", "Khôi phục mật khẩu OTP");
            if (p.Contains("/api/auth/profile")) return ("Bảo Mật", method == "GET" ? "Xem thông tin cá nhân" : "Cập nhật thông tin cá nhân");
            if (p.Contains("/api/admin/users"))
            {
                if (method == "GET") return ("Bảo Mật", "Xem danh sách người dùng");
                if (method == "POST") return ("Bảo Mật", "Thêm người dùng mới");
                if (method == "PUT") return ("Bảo Mật", "Cập nhật phân quyền người dùng");
                if (method == "DELETE") return ("Bảo Mật", "Khóa/Xóa tài khoản người dùng");
                return ("Bảo Mật", "Quản lý tài khoản Admin");
            }

            // Phân hệ Gói cước & Bảng giá
            if (p.Contains("/qr-code")) return ("Gói Cước & Giá", "Xem/Tạo mã QR gói dịch vụ");
            if (p.Contains("/prices")) return ("Gói Cước & Giá", method == "GET" ? "Xem bảng giá gói cước" : "Cập nhật bảng giá gói cước");
            if (p.Contains("/api/service-plans"))
            {
                if (method == "GET") return ("Gói Cước & Giá", "Xem danh sách gói dịch vụ");
                if (method == "POST") return ("Gói Cước & Giá", "Thêm mới gói dịch vụ");
                if (method == "PUT") return ("Gói Cước & Giá", "Cập nhật gói dịch vụ");
                if (method == "DELETE") return ("Gói Cước & Giá", "Xóa gói dịch vụ");
                return ("Gói Cước & Giá", "Quản lý gói dịch vụ");
            }
            if (p.Contains("/api/service-categories"))
            {
                if (method == "GET") return ("Gói Cước & Giá", "Xem danh sách danh mục dịch vụ");
                if (method == "POST") return ("Gói Cước & Giá", "Tạo mới danh mục dịch vụ");
                if (method == "PUT") return ("Gói Cước & Giá", "Cập nhật danh mục dịch vụ");
                if (method == "DELETE") return ("Gói Cước & Giá", "Xóa danh mục dịch vụ");
                return ("Gói Cước & Giá", "Quản lý danh mục dịch vụ");
            }
            if (p.Contains("/api/promotions")) return ("Gói Cước & Giá", method == "GET" ? "Xem chương trình khuyến mãi" : "Quản lý khuyến mãi");

            // Phân hệ Đơn hàng, Thanh toán & Affiliate
            if (p.Contains("/api/order-requests/export")) return ("Đơn Hàng & CTV", "Xuất file báo cáo đơn hàng Excel/CSV");
            if (p.Contains("/api/order-requests/my-orders")) return ("Đơn Hàng & CTV", "Xem danh sách gói cước đã mua (My Plans)");
            if (p.Contains("/api/order-requests"))
            {
                if (method == "GET") return ("Đơn Hàng & CTV", "Xem danh sách yêu cầu dịch vụ");
                if (method == "POST") return ("Đơn Hàng & CTV", "Tạo yêu cầu đặt dịch vụ");
                if (method == "PUT") return ("Đơn Hàng & CTV", "Duyệt/Cập nhật đơn hàng");
                return ("Đơn Hàng & CTV", "Quản lý đơn hàng dịch vụ");
            }
            if (p.Contains("/api/payment")) return ("Đơn Hàng & CTV", "Xử lý thanh toán PayOS / VietQR");
            if (p.Contains("/api/affiliates")) return ("Đơn Hàng & CTV", method == "POST" ? "Đăng ký đối tác Affiliate CTV" : "Xem danh sách đăng ký Affiliate");

            // Phân hệ Tin tức & CMS
            if (p.Contains("/api/news")) return ("Tin Tức", method == "GET" ? "Xem bài viết tin tức" : "Soạn thảo/Quản lý bài viết");
            if (p.Contains("/api/testimonials")) return ("Tin Tức", "Xem/Quản lý đánh giá khách hàng");

            // Phân hệ Thống kê & Hệ thống
            if (p.Contains("/api/statistics/dashboard")) return ("Hệ Thống", "Xem tổng quan thống kê Dashboard");
            if (p.Contains("/api/statistics/orders") || p.Contains("/api/statistics")) return ("Hệ Thống", "Xem biểu đồ thống kê đơn hàng");
            if (p.Contains("/api/admin/audit-logs")) return ("Hệ Thống", "Xem nhật ký hệ thống AuditLog");
            if (p.Contains("/hubs/datasync")) return ("Hệ Thống", "Đồng bộ dữ liệu thời gian thực SignalR");

            return ("Hệ Thống", $"Truy cập API {method} {path}");
        }
    }
}
