using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Audit;
using CloudService.Application.DTOs.Common;

namespace CloudService.Application.Interfaces
{
    public interface IAuditLogService
    {
        Task<PagedResult<AuditLogDto>> GetLogsAsync(int pageNumber = 1, int pageSize = 15, string? search = null, string? type = null);
        Task<AuditLogDto> LogAsync(string username, string action, string? payload = null, int? userId = null);
    }
}
