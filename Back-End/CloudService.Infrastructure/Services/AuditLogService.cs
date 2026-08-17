using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Audit;
using CloudService.Application.DTOs.Common;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly ApplicationDbContext _context;

        public AuditLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<AuditLogDto>> GetLogsAsync(int pageNumber = 1, int pageSize = 15, string? search = null, string? type = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 15;

            var query = _context.AuditLogs
                .IgnoreQueryFilters()
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(l =>
                    l.Username.ToLower().Contains(search) ||
                    l.Action.ToLower().Contains(search) ||
                    (l.Payload != null && l.Payload.ToLower().Contains(search)));
            }

            var totalItems = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(l => MapToDto(l))
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(type) && type != "Tất cả")
            {
                items = items.Where(i => i.Type == type).ToList();
            }

            return new PagedResult<AuditLogDto>
            {
                Items = items,
                TotalItems = totalItems,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<AuditLogDto> LogAsync(string username, string action, string? payload = null, int? userId = null)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Username = username,
                Action = action,
                Payload = payload,
                Timestamp = DateTime.UtcNow,
                IsActive = true
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();

            return MapToDto(log);
        }

        private static AuditLogDto MapToDto(AuditLog l)
        {
            var logType = "Hệ Thống";
            var actionLower = l.Action.ToLower();
            if (actionLower.Contains("đăng nhập") || actionLower.Contains("mật khẩu") || actionLower.Contains("khóa"))
            {
                logType = "Bảo Mật";
            }
            else if (actionLower.Contains("đơn hàng") || actionLower.Contains("order") || actionLower.Contains("affiliate"))
            {
                logType = "Đơn Hàng";
            }
            else if (actionLower.Contains("bài viết") || actionLower.Contains("tin tức") || actionLower.Contains("news"))
            {
                logType = "Tin Tức";
            }

            return new AuditLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Action = l.Action,
                Payload = l.Payload,
                Timestamp = l.Timestamp,
                Type = logType,
                Status = actionLower.Contains("thất bại") || actionLower.Contains("lỗi") ? "Thất bại" : "Thành công"
            };
        }
    }
}
