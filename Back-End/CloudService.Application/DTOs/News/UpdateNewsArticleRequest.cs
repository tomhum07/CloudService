using System;

namespace CloudService.Application.DTOs.News
{
    public class UpdateNewsArticleRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? CategoryName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }
}