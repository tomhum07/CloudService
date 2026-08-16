using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Services
{
    public class PlanPriceService : IPlanPriceService
    {
        private readonly ApplicationDbContext _context;

        public PlanPriceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlanPriceDto>> GetPricesByPlanIdAsync(int planId, bool includeInactive = false)
        {
            var query = _context.PlanPrices.AsQueryable();
            if (includeInactive)
            {
                query = query.IgnoreQueryFilters();
            }

            var prices = await query
                .Include(p => p.Promotion)
                .Where(p => p.PlanId == planId)
                .Select(p => new PlanPriceDto
                {
                    Id = p.Id,
                    PlanId = p.PlanId,
                    BillingCycle = p.BillingCycle,
                    Price = p.Price,
                    PromotionId = p.PromotionId,
                    PromotionName = p.Promotion != null ? p.Promotion.Name : null,
                    DiscountPercentage = p.Promotion != null ? p.Promotion.DiscountPercentage : (decimal?)null,
                    IsActive = p.IsActive
                })
                .ToListAsync();

            return prices;
        }

        public async Task<PlanPriceDto> CreatePriceAsync(int planId, CreatePlanPriceRequest request)
        {
            var planPrice = new PlanPrice
            {
                PlanId = planId,
                BillingCycle = request.BillingCycle,
                Price = request.Price,
                PromotionId = request.PromotionId
            };

            _context.PlanPrices.Add(planPrice);
            await _context.SaveChangesAsync();

            return await GetPriceDtoByIdAsync(planPrice.Id);
        }

        public async Task<PlanPriceDto?> UpdatePriceAsync(int planId, int priceId, UpdatePlanPriceRequest request)
        {
            var planPrice = await _context.PlanPrices
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == priceId && p.PlanId == planId);

            if (planPrice == null)
                return null;

            planPrice.BillingCycle = request.BillingCycle;
            planPrice.Price = request.Price;
            planPrice.PromotionId = request.PromotionId;
            planPrice.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return await GetPriceDtoByIdAsync(planPrice.Id);
        }

        public async Task<bool> DeletePriceAsync(int planId, int priceId)
        {
            var planPrice = await _context.PlanPrices
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == priceId && p.PlanId == planId);

            if (planPrice == null)
                return false;

            planPrice.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<PromotionDto>> GetAllPromotionsAsync()
        {
            var promotions = await _context.Promotions
                .Select(p => new PromotionDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    DiscountPercentage = p.DiscountPercentage,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    IsActive = p.IsActive
                })
                .ToListAsync();

            return promotions;
        }

        public async Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request)
        {
            var promotion = new Promotion
            {
                Name = request.Name,
                DiscountPercentage = (int)request.DiscountPercentage,
                StartDate = request.StartDate,
                EndDate = request.EndDate
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return new PromotionDto
            {
                Id = promotion.Id,
                Name = promotion.Name,
                DiscountPercentage = promotion.DiscountPercentage,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                IsActive = promotion.IsActive
            };
        }

        private async Task<PlanPriceDto> GetPriceDtoByIdAsync(int priceId)
        {
            var price = await _context.PlanPrices
                .IgnoreQueryFilters()
                .Include(p => p.Promotion)
                .Where(p => p.Id == priceId)
                .Select(p => new PlanPriceDto
                {
                    Id = p.Id,
                    PlanId = p.PlanId,
                    BillingCycle = p.BillingCycle,
                    Price = p.Price,
                    PromotionId = p.PromotionId,
                    PromotionName = p.Promotion != null ? p.Promotion.Name : null,
                    DiscountPercentage = p.Promotion != null ? p.Promotion.DiscountPercentage : (decimal?)null,
                    IsActive = p.IsActive
                })
                .FirstAsync();

            return price;
        }
    }
}
