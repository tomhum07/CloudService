using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.News;

namespace CloudService.Application.Interfaces
{
    public interface INewsArticleService
    {
        Task<PagedNewsResult> GetAllAsync(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            bool includeInactive = false);

        Task<NewsArticleDto?> GetByIdAsync(int id);

        Task<NewsArticleDto?> GetBySlugAsync(string slug);

        Task<NewsArticleDto> CreateAsync(CreateNewsArticleRequest request);

        Task<NewsArticleDto?> UpdateAsync(
            int id,
            UpdateNewsArticleRequest request);

        Task<bool> DeleteAsync(int id);
    }
}