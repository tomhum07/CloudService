using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CloudService.Application.DTOs.Affiliates;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Hubs;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/affiliates")]
    public class AffiliatesController : ControllerBase
    {
        private readonly IAffiliateService _affiliateService;
        private readonly IAuditLogService _auditLogService;
        private readonly IEmailService _emailService;
        private readonly IHubContext<DataSyncHub> _hubContext;

        public AffiliatesController(
            IAffiliateService affiliateService, 
            IAuditLogService auditLogService,
            IEmailService emailService,
            IHubContext<DataSyncHub> hubContext)
        {
            _affiliateService = affiliateService;
            _auditLogService = auditLogService;
            _emailService = emailService;
            _hubContext = hubContext;
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

            await _hubContext.Clients.All.SendAsync("DataChanged", "affiliate", "create");

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

            // Gửi email thông báo xét duyệt thành công hoặc từ chối
            if (!string.IsNullOrWhiteSpace(updated.Email))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        if (dto.Status == 2) // Approved
                        {
                            await _emailService.SendAffiliateApprovalNotificationAsync(updated.Email, updated.FullName);
                        }
                        else if (dto.Status == 3) // Rejected
                        {
                            await _emailService.SendAffiliateRejectionNotificationAsync(updated.Email, updated.FullName);
                        }
                    }
                    catch { }
                });
            }

            await _hubContext.Clients.All.SendAsync("DataChanged", "affiliate", "update");

            return Ok(updated);
        }
    }
}
