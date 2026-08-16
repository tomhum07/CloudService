using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class ServiceCategoryService : IServiceCategoryService
    {
        private readonly ApplicationDbContext _context;

        public ServiceCategoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ServiceCategoryDto>> GetAllAsync(bool includeInactive = false)
        {
            var query = _context.ServiceCategories.AsQueryable();
            if (includeInactive)
            {
                query = query.IgnoreQueryFilters();
            }

            return await query
                .Select(c => new ServiceCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ServiceCategoryDto?> GetByIdAsync(int id)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return null;

            return new ServiceCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            };
        }

        public async Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryRequest request)
        {
            var category = new ServiceCategory
            {
                Name = request.Name,
                Slug = request.Slug,
                Description = request.Description
            };

            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            return new ServiceCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            };
        }

        public async Task<ServiceCategoryDto?> UpdateAsync(int id, UpdateServiceCategoryRequest request)
        {
            var category = await _context.ServiceCategories.FindAsync(id);
            if (category == null) return null;

            category.Name = request.Name;
            category.Slug = request.Slug;
            category.Description = request.Description;
            category.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return new ServiceCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _context.ServiceCategories
                .Include(c => c.Plans)
                    .ThenInclude(p => p.Prices)
                .FirstOrDefaultAsync(c => c.Id == id);
                
            if (category == null) return false;

            category.IsActive = false;

            foreach (var plan in category.Plans)
            {
                plan.IsActive = false;
                foreach (var price in plan.Prices)
                {
                    price.IsActive = false;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
