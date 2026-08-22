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

            // Lọc theo phân loại trực tiếp tại database
            if (!string.IsNullOrWhiteSpace(type) && type != "Tất cả")
            {
                switch (type)
                {
                    case "Bảo Mật":
                        query = query.Where(l =>
                            l.Action.ToLower().Contains("đăng nhập") ||
                            l.Action.ToLower().Contains("đăng ký") ||
                            l.Action.ToLower().Contains("mật khẩu") ||
                            l.Action.ToLower().Contains("khóa") ||
                            l.Action.ToLower().Contains("tài khoản") ||
                            l.Action.ToLower().Contains("quyền"));
                        break;
                    case "Gói Cước & Giá":
                        query = query.Where(l =>
                            l.Action.ToLower().Contains("danh mục") ||
                            l.Action.ToLower().Contains("gói") ||
                            l.Action.ToLower().Contains("giá") ||
                            l.Action.ToLower().Contains("khuyến mãi") ||
                            l.Action.ToLower().Contains("qr"));
                        break;
                    case "Đơn Hàng & CTV":
                        query = query.Where(l =>
                            l.Action.ToLower().Contains("đơn hàng") ||
                            l.Action.ToLower().Contains("order") ||
                            l.Action.ToLower().Contains("thanh toán") ||
                            l.Action.ToLower().Contains("payos") ||
                            l.Action.ToLower().Contains("affiliate") ||
                            l.Action.ToLower().Contains("ctv") ||
                            l.Action.ToLower().Contains("đối tác"));
                        break;
                    case "Tin Tức":
                        query = query.Where(l =>
                            l.Action.ToLower().Contains("bài viết") ||
                            l.Action.ToLower().Contains("tin tức") ||
                            l.Action.ToLower().Contains("news"));
                        break;
                }
            }

            var totalItems = await query.CountAsync();
            var rawItems = await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = rawItems.Select(l => MapToDto(l)).ToList();

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
                Username = string.IsNullOrWhiteSpace(username) ? "system" : username,
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

            if (actionLower.Contains("đăng nhập") || actionLower.Contains("đăng ký") || actionLower.Contains("mật khẩu") || actionLower.Contains("khóa") || actionLower.Contains("tài khoản") || actionLower.Contains("quyền"))
            {
                logType = "Bảo Mật";
            }
            else if (actionLower.Contains("danh mục") || actionLower.Contains("gói") || actionLower.Contains("giá") || actionLower.Contains("khuyến mãi") || actionLower.Contains("qr"))
            {
                logType = "Gói Cước & Giá";
            }
            else if (actionLower.Contains("đơn hàng") || actionLower.Contains("order") || actionLower.Contains("thanh toán") || actionLower.Contains("payos") || actionLower.Contains("affiliate") || actionLower.Contains("ctv") || actionLower.Contains("đối tác"))
            {
                logType = "Đơn Hàng & CTV";
            }
            else if (actionLower.Contains("bài viết") || actionLower.Contains("tin tức") || actionLower.Contains("news"))
            {
                logType = "Tin Tức";
            }

            var isFailure = actionLower.Contains("thất bại") || actionLower.Contains("lỗi") || actionLower.Contains("từ chối") || actionLower.Contains("hủy");

            return new AuditLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Action = l.Action,
                Payload = l.Payload,
                Timestamp = l.Timestamp,
                Type = logType,
                Status = isFailure ? (actionLower.Contains("từ chối") || actionLower.Contains("hủy") ? "Cảnh báo" : "Thất bại") : "Thành công"
            };
        }
    }
}
