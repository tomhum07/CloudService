using System;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        public int? UserId { get; set; }
        public virtual AppUser? User { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Payload { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
