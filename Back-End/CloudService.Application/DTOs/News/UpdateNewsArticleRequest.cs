using System;

namespace CloudService.Application.DTOs.News
{
    public class UpdateNewsArticleRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime? PublishedAt { get; set; }
    }
}