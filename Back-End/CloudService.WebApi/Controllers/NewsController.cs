using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using CloudService.Application.DTOs.News;
using CloudService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;


namespace CloudService.WebApi.Controllers
{
    [Route("api/news")]
    [ApiController]
    public class NewsController : ControllerBase
    {
        private readonly INewsArticleService _newsArticleService;
        private readonly IAuditLogService _auditLogService;

        public NewsController(INewsArticleService newsArticleService, IAuditLogService auditLogService)
        {
            _newsArticleService = newsArticleService;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedNewsResult>> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageNumber = 0,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] bool includeInactive = false)
        {
            int targetPage = pageNumber > 0 ? pageNumber : page;
            var articles = await _newsArticleService.GetAllAsync(
                targetPage,
                pageSize,
                search,
                category,
                includeInactive);

            return Ok(articles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NewsArticleDto>> GetById(int id)
        {
            var article = await _newsArticleService.GetByIdAsync(id);

            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<NewsArticleDto>> GetBySlug(string slug)
        {
            var article = await _newsArticleService.GetBySlugAsync(slug);

            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<ActionResult<NewsArticleDto>> Create(
            [FromBody] CreateNewsArticleRequest request)
        {
            var actor = User?.Identity?.Name ?? "Editor";
            var userIdClaim = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                request.AuthorId = userId;
            }
            else
            {
                return Unauthorized(new { message = "Không xác định được danh tính người viết bài." });
            }

            var article = await _newsArticleService.CreateAsync(request);
            await _auditLogService.LogAsync(actor, "Đăng bài viết mới", $"Đăng bài: '{article.Title}' (slug: {article.Slug})", userId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = article.Id },
                article);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<ActionResult<NewsArticleDto>> Update(
            int id,
            [FromBody] UpdateNewsArticleRequest request)
        {
            var actor = User?.Identity?.Name ?? "Editor";
            var article = await _newsArticleService.UpdateAsync(id, request);

            if (article == null)
                return NotFound();

            await _auditLogService.LogAsync(actor, "Cập nhật bài viết", $"Chỉnh sửa bài viết #{id}: '{article.Title}'");
            return Ok(article);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<IActionResult> Delete(int id)
        {
            var actor = User?.Identity?.Name ?? "Editor";
            var result = await _newsArticleService.DeleteAsync(id);

            if (!result)
                return NotFound();

            await _auditLogService.LogAsync(actor, "Xóa bài viết", $"Đã xóa bài viết tin tức #{id}");
            return NoContent();
        }
    }
}