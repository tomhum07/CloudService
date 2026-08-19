using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [Route("api/promotions")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly IPlanPriceService _planPriceService;

        public PromotionsController(IPlanPriceService planPriceService)
        {
            _planPriceService = planPriceService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAll()
        {
            var promotions = await _planPriceService.GetAllPromotionsAsync();
            return Ok(promotions);
        }

        [HttpGet("validate/{code}")]
        public async Task<ActionResult<PromotionDto>> Validate(string code)
        {
            var promotion = await _planPriceService.ValidatePromotionAsync(code);
            if (promotion == null)
            {
                return NotFound(new { message = "Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng." });
            }
            return Ok(promotion);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PromotionDto>> Create([FromBody] CreatePromotionRequest request)
        {
            var promotion = await _planPriceService.CreatePromotionAsync(request);
            return CreatedAtAction(nameof(GetAll), new { }, promotion);
        }
    }
}
