using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.News;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class NewsArticleService : INewsArticleService
    {
        private readonly ApplicationDbContext _context;

        public NewsArticleService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedNewsResult> GetAllAsync(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            bool includeInactive = false)
        {
            if (page < 1)
                page = 1;

            if (pageSize < 1)
                pageSize = 10;

            if (pageSize > 100)
                pageSize = 100;

            var query = _context.NewsArticles
                .Include(x => x.Author)
                .AsQueryable();

            if (includeInactive)
            {
                query = query.IgnoreQueryFilters();
            }

    // Tìm kiếm theo tiêu đề, tóm tắt hoặc nội dung
    if (!string.IsNullOrWhiteSpace(search))
    {
        search = search.Trim();

        query = query.Where(x =>
            x.Title.Contains(search) ||
            (x.Summary != null && x.Summary.Contains(search)) ||
            x.Content.Contains(search));
    }

    // Tổng số bài viết sau khi tìm kiếm
    var totalItems = await query.CountAsync();

    // Tổng số trang
    var totalPages = (int)Math.Ceiling(
        totalItems / (double)pageSize);

    // Lấy dữ liệu theo trang
    var articles = await query
        .OrderByDescending(x => x.PublishedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(x => new NewsArticleDto
        {
            Id = x.Id,
            Title = x.Title,
            Slug = x.Slug,
            Summary = x.Summary,
            ThumbnailUrl = x.ThumbnailUrl,
            Content = x.Content,
            AuthorId = x.AuthorId,
            AuthorName = x.Author != null
                ? x.Author.FullName
                : null,
            PublishedAt = x.PublishedAt,
            IsActive = x.IsActive
        })
        .ToListAsync();

    return new PagedNewsResult
    {
        Items = articles,
        Page = page,
        PageSize = pageSize,
        TotalItems = totalItems,
        TotalPages = totalPages
    };
}

        public async Task<NewsArticleDto?> GetByIdAsync(int id)
        {
            return await _context.NewsArticles
                .IgnoreQueryFilters()
                .Include(x => x.Author)
                .Where(x => x.Id == id)
                .Select(x => new NewsArticleDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Slug = x.Slug,
                    Summary = x.Summary,
                    ThumbnailUrl = x.ThumbnailUrl,
                    Content = x.Content,
                    AuthorId = x.AuthorId,
                    AuthorName = x.Author != null ? x.Author.FullName : null,
                    PublishedAt = x.PublishedAt,
                    IsActive = x.IsActive
                })
                .FirstOrDefaultAsync();
        }

        public async Task<NewsArticleDto?> GetBySlugAsync(string slug)
        {
            return await _context.NewsArticles
                .IgnoreQueryFilters()
                .Include(x => x.Author)
                .Where(x => x.Slug == slug)
                .Select(x => new NewsArticleDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Slug = x.Slug,
                    Summary = x.Summary,
                    ThumbnailUrl = x.ThumbnailUrl,
                    Content = x.Content,
                    AuthorId = x.AuthorId,
                    AuthorName = x.Author != null ? x.Author.FullName : null,
                    PublishedAt = x.PublishedAt,
                    IsActive = x.IsActive
                })
                .FirstOrDefaultAsync();
        }

        public async Task<NewsArticleDto> CreateAsync(CreateNewsArticleRequest request)
        {
            var slug = string.IsNullOrWhiteSpace(request.Slug)
                ? GenerateSlug(request.Title)
                : request.Slug.Trim();

            // Ensure unique slug
            var baseSlug = slug;
            var counter = 1;
            while (await _context.NewsArticles.IgnoreQueryFilters().AnyAsync(x => x.Slug == slug))
            {
                slug = $"{baseSlug}-{counter++}";
            }

            var publishedDate = request.IsActive
                ? (request.PublishedAt ?? System.DateTime.UtcNow)
                : (DateTime?)null;

            var article = new NewsArticle
            {
                Title = request.Title.Trim(),
                Slug = slug,
                Summary = request.Summary?.Trim(),
                ThumbnailUrl = request.ThumbnailUrl?.Trim(),
                Content = request.Content ?? string.Empty,
                AuthorId = request.AuthorId,
                PublishedAt = publishedDate,
                IsActive = request.IsActive
            };

            _context.NewsArticles.Add(article);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(article.Id))!;
        }

        public async Task<NewsArticleDto?> UpdateAsync(
            int id,
            UpdateNewsArticleRequest request)
        {
            var article = await _context.NewsArticles
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
                return null;

            var slug = string.IsNullOrWhiteSpace(request.Slug)
                ? GenerateSlug(request.Title)
                : request.Slug.Trim();

            var baseSlug = slug;
            var counter = 1;
            while (await _context.NewsArticles.IgnoreQueryFilters().AnyAsync(x => x.Slug == slug && x.Id != id))
            {
                slug = $"{baseSlug}-{counter++}";
            }

            article.Title = request.Title.Trim();
            article.Slug = slug;
            article.Summary = request.Summary?.Trim();
            article.ThumbnailUrl = request.ThumbnailUrl?.Trim();
            article.Content = request.Content ?? string.Empty;
            article.PublishedAt = request.IsActive 
                ? (request.PublishedAt ?? article.PublishedAt ?? System.DateTime.UtcNow) 
                : null;
            article.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        private static string GenerateSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "bai-viet-" + System.Guid.NewGuid().ToString("N")[..6];

            string unaccented = text.ToLowerInvariant();
            // Remove vietnamese accents
            string[] vietnameseSigns = new string[]
            {
                "aAeEoOuUiIdDyY",
                "áàạảãâấầậẩẫăắằặẳẵ",
                "ÁÀẠẢÃÂẤẦẬẨẪĂẮẰẶẲẴ",
                "éèẹẻẽêếềệểễ",
                "ÉÈẸẺẼÊẾỀỆỂỄ",
                "óòọỏõôốồộổỗơớờợởỡ",
                "ÓÒỌỎÕÔỐỒỘỔỖƠỚỜỢỞỠ",
                "úùụủũưứừựửữ",
                "ÚÙỤỦŨƯỨỪỰỬỮ",
                "íìịỉĩ",
                "ÍÌỊỈĨ",
                "đ",
                "Đ",
                "ýỳỵỷỹ",
                "ÝỲỴỶỸ"
            };

            for (int i = 1; i < vietnameseSigns.Length; i++)
            {
                for (int j = 0; j < vietnameseSigns[i].Length; j++)
                    unaccented = unaccented.Replace(vietnameseSigns[i][j], vietnameseSigns[0][i - 1]);
            }

            var clean = System.Text.RegularExpressions.Regex.Replace(unaccented, @"[^a-z0-9\s-]", "");
            clean = System.Text.RegularExpressions.Regex.Replace(clean, @"\s+", " ").Trim();
            clean = clean.Replace(" ", "-");
            return string.IsNullOrWhiteSpace(clean) ? "bai-viet-" + System.Guid.NewGuid().ToString("N")[..6] : clean;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var article = await _context.NewsArticles
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
                return false;

            article.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}