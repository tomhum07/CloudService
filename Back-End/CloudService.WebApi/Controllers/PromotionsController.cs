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
        public async Task<ActionResult<IEnumerable<PromotionDto>>> GetAll([FromQuery] bool activeOnly = false)
        {
            var promotions = await _planPriceService.GetAllPromotionsAsync(activeOnly);
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
            await _auditLogService.LogAsync(actor, "Tạo khuyến mãi mới", $"Tạo chương trình khuyến mãi: {promotion.Name} (Giảm {promotion.DiscountPercentage}%) - Hiệu lực: {promotion.StartDate:dd/MM/yyyy} đến {promotion.EndDate:dd/MM/yyyy}");
            await _hubContext.Clients.All.SendAsync("DataChanged", "promotion", "create");
            return CreatedAtAction(nameof(GetAll), new { }, promotion);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PromotionDto>> Update(int id, [FromBody] UpdatePromotionRequest request)
        {
            var actor = User?.Identity?.Name ?? "Admin";
            var promotion = await _planPriceService.UpdatePromotionAsync(id, request);
            if (promotion == null)
            {
                return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });
            }

            await _auditLogService.LogAsync(actor, "Cập nhật khuyến mãi", $"Sửa chương trình khuyến mãi #{id}: {promotion.Name} (Giảm {promotion.DiscountPercentage}%) - Hiệu lực: {promotion.StartDate:dd/MM/yyyy} đến {promotion.EndDate:dd/MM/yyyy}");
            await _hubContext.Clients.All.SendAsync("DataChanged", "promotion", "update");
            return Ok(promotion);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var actor = User?.Identity?.Name ?? "Admin";
            var success = await _planPriceService.DeletePromotionAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy chương trình khuyến mãi." });
            }

            await _auditLogService.LogAsync(actor, "Xóa khuyến mãi", $"Xóa chương trình khuyến mãi #{id}");
            await _hubContext.Clients.All.SendAsync("DataChanged", "promotion", "delete");
            return NoContent();
        }
    }
}
