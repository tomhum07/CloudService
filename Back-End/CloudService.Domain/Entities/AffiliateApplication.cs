using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class AffiliateApplication : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Motivation { get; set; }
        public int Status { get; set; } = 0; // 0: New, 1: Processing, 2: Approved, 3: Rejected
    }
}
