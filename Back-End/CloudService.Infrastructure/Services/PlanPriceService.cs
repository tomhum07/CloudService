using System;
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

            var now = DateTime.UtcNow;

            var prices = await query
                .Where(p => p.PlanId == planId)
                .Select(p => new PlanPriceDto
                {
                    Id = p.Id,
                    PlanId = p.PlanId,
                    BillingCycle = p.BillingCycle,
                    Price = p.Price,
                    PromotionId = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? p.PromotionId : null,
                    PromotionName = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? p.Promotion.Name : null,
                    DiscountPercentage = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? (decimal?)p.Promotion.DiscountPercentage : null,
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

        public async Task<IEnumerable<PromotionDto>> GetAllPromotionsAsync(bool activeOnly = false)
        {
            var now = DateTime.UtcNow;
            var query = _context.Promotions.IgnoreQueryFilters().AsQueryable();

            if (activeOnly)
            {
                query = query.Where(p => p.IsActive
                    && (p.StartDate == default || p.StartDate <= now)
                    && (p.EndDate == default || p.EndDate >= now));
            }

            var promotions = await query
                .OrderByDescending(p => p.CreatedAt)
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
            var startDate = request.StartDate == default ? DateTime.UtcNow : request.StartDate.ToUniversalTime();
            var endDate = request.EndDate == default ? DateTime.UtcNow.AddDays(30) : request.EndDate.ToUniversalTime();

            var promotion = new Promotion
            {
                Name = request.Name.Trim(),
                DiscountPercentage = (int)request.DiscountPercentage,
                StartDate = startDate,
                EndDate = endDate,
                IsActive = request.IsActive
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

        public async Task<PromotionDto?> UpdatePromotionAsync(int id, UpdatePromotionRequest request)
        {
            var promotion = await _context.Promotions.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
            if (promotion == null) return null;

            var startDate = request.StartDate == default ? DateTime.UtcNow : request.StartDate.ToUniversalTime();
            var endDate = request.EndDate == default ? DateTime.UtcNow.AddDays(30) : request.EndDate.ToUniversalTime();

            promotion.Name = request.Name.Trim();
            promotion.DiscountPercentage = (int)request.DiscountPercentage;
            promotion.StartDate = startDate;
            promotion.EndDate = endDate;
            promotion.IsActive = request.IsActive;

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

        public async Task<bool> DeletePromotionAsync(int id)
        {
            var promotion = await _context.Promotions.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
            if (promotion == null) return false;

            // Xóa liên kết khuyến mãi khỏi các PlanPrice trước khi xóa
            var linkedPrices = await _context.PlanPrices.IgnoreQueryFilters().Where(p => p.PromotionId == id).ToListAsync();
            foreach (var price in linkedPrices)
            {
                price.PromotionId = null;
            }

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PromotionDto?> ValidatePromotionAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return null;

            var trimmedCode = code.Trim().ToLower();
            var now = DateTime.UtcNow;

            var promotion = await _context.Promotions
                .Where(p => p.IsActive && p.Name.ToLower() == trimmedCode)
                .FirstOrDefaultAsync();

            if (promotion == null) return null;

            // Kiểm tra thời hạn hiệu lực (StartDate và EndDate)
            if (promotion.StartDate != default && promotion.StartDate > now) return null;
            if (promotion.EndDate != default && promotion.EndDate < now) return null;

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
            var now = DateTime.UtcNow;

            var price = await _context.PlanPrices
                .IgnoreQueryFilters()
                .Where(p => p.Id == priceId)
                .Select(p => new PlanPriceDto
                {
                    Id = p.Id,
                    PlanId = p.PlanId,
                    BillingCycle = p.BillingCycle,
                    Price = p.Price,
                    PromotionId = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? p.PromotionId : null,
                    PromotionName = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? p.Promotion.Name : null,
                    DiscountPercentage = (p.Promotion != null && p.Promotion.IsActive && (p.Promotion.EndDate == default || p.Promotion.EndDate >= now) && (p.Promotion.StartDate == default || p.Promotion.StartDate <= now)) ? (decimal?)p.Promotion.DiscountPercentage : null,
                    IsActive = p.IsActive
                })
                .FirstAsync();

            return price;
        }
    }
}
