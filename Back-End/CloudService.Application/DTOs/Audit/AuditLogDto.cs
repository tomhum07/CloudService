using System;

namespace CloudService.Application.DTOs.Audit
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Payload { get; set; }
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = "Hệ Thống"; // Bảo Mật, Đơn Hàng, Tin Tức, Hệ Thống
        public string Status { get; set; } = "Thành công";
    }

    public class CreateAuditLogDto
    {
        public int? UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Payload { get; set; }
    }
}
