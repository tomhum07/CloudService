using System;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class NewsArticle : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? Category { get; set; } = "Tin Tức";
        public int AuthorId { get; set; }
        public virtual AppUser? Author { get; set; }
        public DateTime? PublishedAt { get; set; }
    }
}
