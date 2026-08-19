using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Statistics;
using CloudService.Application.Interfaces;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class StatisticsService : IStatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var orders = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                .AsNoTracking()
                .ToListAsync();

            var totalOrders = orders.Count;
            var pendingOrders = orders.Count(o => o.Status == 0 || o.Status == 1);
            var completedOrders = orders.Where(o => o.Status == 2).ToList();

            var totalRevenue = completedOrders.Sum(o => o.PlanPrice?.Price ?? 0);
            var monthlyRevenue = completedOrders
                .Where(o => o.CreatedAt >= startOfMonth)
                .Sum(o => o.PlanPrice?.Price ?? 0);

            var activeAffiliates = await _context.AffiliateApplications
                .IgnoreQueryFilters()
                .CountAsync(a => a.Status == 2);

            var totalUsers = await _context.AppUsers
                .IgnoreQueryFilters()
                .CountAsync();

            var totalPlans = await _context.ServicePlans
                .IgnoreQueryFilters()
                .CountAsync();

            var monthlyOrders = await GetMonthlyOrderStatsAsync();
            var popularPlans = await GetPopularPlanStatsAsync();

            return new DashboardStatsDto
            {
                TotalRevenue = totalRevenue,
                MonthlyRevenue = monthlyRevenue,
                TotalOrders = totalOrders,
                PendingOrders = pendingOrders,
                ActiveAffiliates = activeAffiliates,
                TotalUsers = totalUsers,
                TotalPlans = totalPlans,
                MonthlyOrders = monthlyOrders,
                PopularPlans = popularPlans
            };
        }

        public async Task<List<MonthlyStatDto>> GetMonthlyOrderStatsAsync()
        {
            var now = DateTime.UtcNow;
            var monthsList = new List<MonthlyStatDto>();

            var orders = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                .AsNoTracking()
                .ToListAsync();

            for (int i = 5; i >= 0; i--)
            {
                var targetMonth = now.AddMonths(-i);
                var monthStart = new DateTime(targetMonth.Year, targetMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var nextMonth = monthStart.AddMonths(1);

                var monthOrders = orders
                    .Where(o => o.CreatedAt >= monthStart && o.CreatedAt < nextMonth)
                    .ToList();

                var revenue = monthOrders
                    .Where(o => o.Status == 2)
                    .Sum(o => o.PlanPrice?.Price ?? 0);

                monthsList.Add(new MonthlyStatDto
                {
                    Month = $"T{targetMonth.Month}/{targetMonth.Year}",
                    OrderCount = monthOrders.Count,
                    Revenue = revenue
                });
            }

            return monthsList;
        }

        public async Task<List<PopularPlanStatDto>> GetPopularPlanStatsAsync()
        {
            var orders = await _context.OrderRequests
                .IgnoreQueryFilters()
                .Include(o => o.PlanPrice)
                    .ThenInclude(p => p!.Plan)
                .AsNoTracking()
                .ToListAsync();

            var totalOrders = orders.Count;
            if (totalOrders == 0)
            {
                var allPlans = await _context.ServicePlans.IgnoreQueryFilters().Take(5).ToListAsync();
                return allPlans.Select(p => new PopularPlanStatDto
                {
                    PlanId = p.Id,
                    PlanName = p.Name,
                    OrderCount = 0,
                    Percentage = 0
                }).ToList();
            }

            var grouped = orders
                .Where(o => o.PlanPrice?.Plan != null)
                .GroupBy(o => new { o.PlanPrice!.Plan!.Id, o.PlanPrice.Plan.Name })
                .Select(g => new PopularPlanStatDto
                {
                    PlanId = g.Key.Id,
                    PlanName = g.Key.Name,
                    OrderCount = g.Count(),
                    Percentage = Math.Round((double)g.Count() / totalOrders * 100, 1)
                })
                .OrderByDescending(p => p.OrderCount)
                .Take(5)
                .ToList();

            return grouped;
        }
    }
}
