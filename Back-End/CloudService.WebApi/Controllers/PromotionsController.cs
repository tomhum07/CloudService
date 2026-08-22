using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Hubs;

namespace CloudService.WebApi.Controllers
{
    [Route("api/promotions")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly IPlanPriceService _planPriceService;
        private readonly IAuditLogService _auditLogService;
        private readonly IHubContext<DataSyncHub> _hubContext;

        public PromotionsController(
            IPlanPriceService planPriceService,
            IAuditLogService auditLogService,
            IHubContext<DataSyncHub> hubContext)
        {
            _planPriceService = planPriceService;
            _auditLogService = auditLogService;
            _hubContext = hubContext;
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
            var actor = User?.Identity?.Name ?? "Admin";
            var promotion = await _planPriceService.CreatePromotionAsync(request);
            await _auditLogService.LogAsync(actor, "Tạo khuyến mãi mới", $"Tạo chương trình khuyến mãi: {promotion.Name} (Giảm {promotion.DiscountPercentage}%)");
            await _hubContext.Clients.All.SendAsync("DataChanged", "promotion", "create");
            return CreatedAtAction(nameof(GetAll), new { }, promotion);
        }
    }
}
