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
    string? search = null)
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
            Content = x.Content,
            AuthorId = x.AuthorId,
            AuthorName = x.Author != null
                ? x.Author.FullName
                : null,
            PublishedAt = x.PublishedAt
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
                .Include(x => x.Author)
                .Where(x => x.Id == id)
                .Select(x => new NewsArticleDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Slug = x.Slug,
                    Summary = x.Summary,
                    Content = x.Content,
                    AuthorId = x.AuthorId,
                    AuthorName = x.Author != null ? x.Author.FullName : null,
                    PublishedAt = x.PublishedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<NewsArticleDto?> GetBySlugAsync(string slug)
        {
            return await _context.NewsArticles
                .Include(x => x.Author)
                .Where(x => x.Slug == slug)
                .Select(x => new NewsArticleDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Slug = x.Slug,
                    Summary = x.Summary,
                    Content = x.Content,
                    AuthorId = x.AuthorId,
                    AuthorName = x.Author != null ? x.Author.FullName : null,
                    PublishedAt = x.PublishedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<NewsArticleDto> CreateAsync(CreateNewsArticleRequest request)
        {
            var article = new NewsArticle
            {
                Title = request.Title,
                Slug = request.Slug,
                Summary = request.Summary,
                Content = request.Content,
                AuthorId = request.AuthorId,
                PublishedAt = request.PublishedAt
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
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
                return null;

            article.Title = request.Title;
            article.Slug = request.Slug;
            article.Summary = request.Summary;
            article.Content = request.Content;
            article.PublishedAt = request.PublishedAt;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var article = await _context.NewsArticles
                .FirstOrDefaultAsync(x => x.Id == id);

            if (article == null)
                return false;

            article.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}