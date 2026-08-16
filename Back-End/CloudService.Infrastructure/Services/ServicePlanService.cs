using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using CloudService.Application.Interfaces;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Services;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class ServicePlanService : IServicePlanService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public ServicePlanService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<PagedResult<ServicePlanDto>> GetPagedAsync(
            int page = 1,
            int pageSize = 10,
            int? categoryId = null,
            string? search = null,
            string? sort = null,
            bool includeInactive = false)
        {
            var query = _context.ServicePlans.AsQueryable();
            if (includeInactive)
            {
                query = query.IgnoreQueryFilters();
            }

            query = query
                .Include(p => p.Category)
                .Include(p => p.Prices);

            if (categoryId.HasValue)
            {
                query = query.Where(x => x.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(x => x.Name.ToLower().Contains(lowerSearch) || 
                                         (x.Description != null && x.Description.ToLower().Contains(lowerSearch)));
            }

            if (!string.IsNullOrWhiteSpace(sort))
            {
                switch (sort.ToLower())
                {
                    case "name":
                        query = query.OrderBy(x => x.Name);
                        break;
                    case "namedesc":
                        query = query.OrderByDescending(x => x.Name);
                        break;
                    case "price":
                        query = query.OrderBy(x => x.Prices.Where(p => p.IsActive).Select(p => (decimal?)p.Price).Min() ?? 0);
                        break;
                    case "pricedesc":
                        query = query.OrderByDescending(x => x.Prices.Where(p => p.IsActive).Select(p => (decimal?)p.Price).Min() ?? 0);
                        break;
                    case "date":
                        query = query.OrderBy(x => x.CreatedAt);
                        break;
                    case "datedesc":
                        query = query.OrderByDescending(x => x.CreatedAt);
                        break;
                    default:
                        query = query.OrderByDescending(x => x.CreatedAt);
                        break;
                }
            }
            else
            {
                query = query.OrderByDescending(x => x.CreatedAt);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new ServicePlanDto
                {
                    Id = x.Id,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category != null ? x.Category.Name : null,
                    Name = x.Name,
                    Description = x.Description,
                    Cpu = x.Cpu,
                    Ram = x.Ram,
                    Storage = x.Storage,
                    Bandwidth = x.Bandwidth,
                    QrCodeUrl = x.QrCodeUrl,
                    IsActive = x.IsActive,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<ServicePlanDto>
            {
                Items = items,
                TotalItems = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        public async Task<ServicePlanDto?> GetByIdAsync(int id)
        {
            var plan = await _context.ServicePlans
                .Include(p => p.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (plan == null) return null;

            return new ServicePlanDto
            {
                Id = plan.Id,
                CategoryId = plan.CategoryId,
                CategoryName = plan.Category?.Name,
                Name = plan.Name,
                Description = plan.Description,
                Cpu = plan.Cpu,
                Ram = plan.Ram,
                Storage = plan.Storage,
                Bandwidth = plan.Bandwidth,
                QrCodeUrl = plan.QrCodeUrl,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<ServicePlanDto> CreateAsync(CreateServicePlanRequest request)
        {
            var plan = new ServicePlan
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                Cpu = request.Cpu,
                Ram = request.Ram,
                Storage = request.Storage,
                Bandwidth = request.Bandwidth,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServicePlans.Add(plan);
            await _context.SaveChangesAsync();

            // Generate QR Code
            string frontendUrl = _configuration["FrontendUrl"] ?? "https://cloudservice-r3rm.onrender.com";
            string link = $"{frontendUrl}/plans/{plan.Id}";
            plan.QrCodeUrl = $"https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl={Uri.EscapeDataString(link)}";
            
            await _context.SaveChangesAsync();

            var category = await _context.ServiceCategories.FindAsync(plan.CategoryId);

            return new ServicePlanDto
            {
                Id = plan.Id,
                CategoryId = plan.CategoryId,
                CategoryName = category?.Name,
                Name = plan.Name,
                Description = plan.Description,
                Cpu = plan.Cpu,
                Ram = plan.Ram,
                Storage = plan.Storage,
                Bandwidth = plan.Bandwidth,
                QrCodeUrl = plan.QrCodeUrl,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<ServicePlanDto?> UpdateAsync(int id, UpdateServicePlanRequest request)
        {
            var plan = await _context.ServicePlans
                .Include(p => p.Category)
                .FirstOrDefaultAsync(x => x.Id == id);
                
            if (plan == null) return null;

            plan.Name = request.Name;
            plan.Description = request.Description;
            plan.Cpu = request.Cpu;
            plan.Ram = request.Ram;
            plan.Storage = request.Storage;
            plan.Bandwidth = request.Bandwidth;
            plan.IsActive = request.IsActive;
            plan.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new ServicePlanDto
            {
                Id = plan.Id,
                CategoryId = plan.CategoryId,
                CategoryName = plan.Category?.Name,
                Name = plan.Name,
                Description = plan.Description,
                Cpu = plan.Cpu,
                Ram = plan.Ram,
                Storage = plan.Storage,
                Bandwidth = plan.Bandwidth,
                QrCodeUrl = plan.QrCodeUrl,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var plan = await _context.ServicePlans
                .Include(p => p.Prices)
                .FirstOrDefaultAsync(x => x.Id == id);
                
            if (plan == null) return false;

            plan.IsActive = false;
            
            foreach (var price in plan.Prices)
            {
                price.IsActive = false;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
