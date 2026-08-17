using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Audit;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/admin/audit-logs")]
    [Route("api/audit-logs")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogsController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? type = null)
        {
            var result = await _auditLogService.GetLogsAsync(page, pageSize, search, type);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateLog([FromBody] CreateAuditLogDto dto)
        {
            var log = await _auditLogService.LogAsync(dto.Username, dto.Action, dto.Payload, dto.UserId);
            return Ok(log);
        }
    }
}
