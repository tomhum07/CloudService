using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Affiliates;
using CloudService.Application.DTOs.Common;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class AffiliateService : IAffiliateService
    {
        private readonly ApplicationDbContext _context;

        public AffiliateService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<AffiliateApplicationDto>> GetApplicationsAsync(int pageNumber = 1, int pageSize = 10, int? status = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.AffiliateApplications
                .IgnoreQueryFilters()
                .AsNoTracking()
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            var totalItems = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(a => MapToDto(a))
                .ToListAsync();

            return new PagedResult<AffiliateApplicationDto>
            {
                Items = items,
                TotalItems = totalItems,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<IEnumerable<AffiliateApplicationDto>> GetAllApplicationsAsync()
        {
            var list = await _context.AffiliateApplications
                .IgnoreQueryFilters()
                .OrderByDescending(a => a.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return list.Select(MapToDto);
        }

        public async Task<AffiliateApplicationDto?> GetByIdAsync(int id)
        {
            var item = await _context.AffiliateApplications
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == id);

            return item == null ? null : MapToDto(item);
        }

        public async Task<AffiliateApplicationDto> CreateApplicationAsync(CreateAffiliateApplicationDto dto)
        {
            var entity = new AffiliateApplication
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                WebsiteUrl = dto.WebsiteUrl,
                Motivation = dto.Motivation,
                Status = 0, // New
                IsActive = true
            };

            await _context.AffiliateApplications.AddAsync(entity);
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<AffiliateApplicationDto?> UpdateStatusAsync(int id, UpdateAffiliateStatusDto dto)
        {
            var entity = await _context.AffiliateApplications.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null) return null;

            entity.Status = dto.Status;
            await _context.SaveChangesAsync();

            return MapToDto(entity);
        }

        private static AffiliateApplicationDto MapToDto(AffiliateApplication a)
        {
            return new AffiliateApplicationDto
            {
                Id = a.Id,
                FullName = a.FullName,
                Email = a.Email,
                Phone = a.Phone,
                WebsiteUrl = a.WebsiteUrl,
                Motivation = a.Motivation,
                Status = a.Status,
                CreatedAt = a.CreatedAt
            };
        }
    }
}
