using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Services
{
    public class StatisticsServiceTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task GetDashboardStatsAsync_ShouldCalculateRevenueAndCounts()
        {
            using var context = CreateInMemoryDbContext();
            var plan = new ServicePlan { Name = "VPS Basic", Cpu = "1 vCPU", Ram = "2GB", Storage = "20GB", Bandwidth = "500GB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 100000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            context.OrderRequests.AddRange(
                new OrderRequest { PlanPriceId = price.Id, CustomerName = "User 1", CustomerEmail = "u1@test.com", CustomerPhone = "123", Status = 2 }, // Completed
                new OrderRequest { PlanPriceId = price.Id, CustomerName = "User 2", CustomerEmail = "u2@test.com", CustomerPhone = "456", Status = 0 }  // Pending
            );
            await context.SaveChangesAsync();

            var service = new StatisticsService(context);
            var stats = await service.GetDashboardStatsAsync();

            Assert.NotNull(stats);
            Assert.Equal(2, stats.TotalOrders);
            Assert.Equal(1, stats.PendingOrders);
            Assert.Equal(100000, stats.TotalRevenue);
            Assert.NotNull(stats.MonthlyOrders);
            Assert.NotNull(stats.PopularPlans);
        }
    }
}
