using System;
using System.Collections.Generic;

namespace CloudService.Application.DTOs.Common
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalItems { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / (PageSize > 0 ? PageSize : 1));
    }
}
