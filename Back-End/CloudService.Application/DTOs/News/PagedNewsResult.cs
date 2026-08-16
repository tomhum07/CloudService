using System.Collections.Generic;

namespace CloudService.Application.DTOs.News
{
    public class PagedNewsResult
    {
        public IEnumerable<NewsArticleDto> Items { get; set; } = new List<NewsArticleDto>();

        public int Page { get; set; }

        public int PageSize { get; set; }

        public int TotalItems { get; set; }

        public int TotalPages { get; set; }
    }
}