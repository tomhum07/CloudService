using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Affiliates;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/affiliates")]
    public class AffiliatesController : ControllerBase
    {
        private readonly IAffiliateService _affiliateService;
        private readonly IAuditLogService _auditLogService;

        public AffiliatesController(IAffiliateService affiliateService, IAuditLogService auditLogService)
        {
            _affiliateService = affiliateService;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetApplications([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] int? status = null)
        {
            var result = await _affiliateService.GetApplicationsAsync(page, pageSize, status);
            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllApplications()
        {
            var result = await _affiliateService.GetAllApplicationsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _affiliateService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy hồ sơ đối tác." });
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] CreateAffiliateApplicationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Phone))
            {
                return BadRequest(new { message = "Vui lòng điền đầy đủ họ tên, email và số điện thoại." });
            }

            var created = await _affiliateService.CreateApplicationAsync(dto);

            await _auditLogService.LogAsync(
                username: dto.Email,
                action: $"Nhận hồ sơ đăng ký CTV mới từ {dto.FullName}",
                payload: dto.WebsiteUrl
            );

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPatch("{id}/status")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAffiliateStatusDto dto)
        {
            var updated = await _affiliateService.UpdateStatusAsync(id, dto);
            if (updated == null) return NotFound(new { message = "Không tìm thấy hồ sơ đối tác." });

            var user = User.Identity?.Name ?? "Admin";
            await _auditLogService.LogAsync(
                username: user,
                action: $"Cập nhật trạng thái đối tác CTV #{updated.Id} ({updated.FullName}) sang '{updated.StatusName}'",
                payload: $"Status={dto.Status}"
            );

            return Ok(updated);
        }
    }
}
