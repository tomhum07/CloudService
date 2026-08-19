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

        public NewsController(INewsArticleService newsArticleService)
        {
            _newsArticleService = newsArticleService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedNewsResult>> GetAll(
            int page = 1,
            int pageSize = 10,
            string? search = null,
            bool includeInactive = false)
        {
            var articles = await _newsArticleService.GetAllAsync(
                page,
                pageSize,
                search,
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
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                request.AuthorId = userId;
            }
            else
            {
                return Unauthorized(new { message = "Không xác định được danh tính người viết bài." });
            }

            var article = await _newsArticleService.CreateAsync(request);

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
            var article = await _newsArticleService.UpdateAsync(id, request);

            if (article == null)
                return NotFound();

            return Ok(article);
        }

        [HttpDelete("{id}")]
[Authorize(Roles = "Admin,Editor")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _newsArticleService.DeleteAsync(id);

            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}