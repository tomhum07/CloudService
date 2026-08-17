using System;

namespace CloudService.Application.DTOs.Affiliates
{
    public class AffiliateApplicationDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Motivation { get; set; }
        public int Status { get; set; } // 0: New, 1: Processing, 2: Approved, 3: Rejected
        public string StatusName => Status switch
        {
            0 => "Chờ duyệt",
            1 => "Đang xử lý",
            2 => "Đã duyệt",
            3 => "Đã từ chối",
            _ => "Không xác định"
        };
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAffiliateApplicationDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Motivation { get; set; }
    }

    public class UpdateAffiliateStatusDto
    {
        public int Status { get; set; }
    }
}
