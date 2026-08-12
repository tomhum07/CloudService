using System;
using System.Linq;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Services;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CloudService.UnitTests.Application.Services
{
    public class PlanPriceServiceTests
    {
        private ApplicationDbContext GetDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task CreatePromotionAsync_ShouldAddPromotion()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            var request = new CreatePromotionRequest
            {
                Name = "Summer Sale",
                DiscountPercentage = 20,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30)
            };

            // Act
            var result = await service.CreatePromotionAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Summer Sale", result.Name);
            Assert.Equal(20, result.DiscountPercentage);
            var count = await context.Promotions.CountAsync();
            Assert.Equal(1, count);
        }

        [Fact]
        public async Task GetAllPromotionsAsync_ShouldReturnList()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Promo 1",
                DiscountPercentage = 10,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(10)
            });

            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Promo 2",
                DiscountPercentage = 15,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(15)
            });

            // Act
            var results = await service.GetAllPromotionsAsync();

            // Assert
            Assert.Equal(2, results.Count());
        }

        [Fact]
        public async Task CreatePriceAsync_ShouldAddPrice()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            var request = new CreatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 100,
                PromotionId = null
            };

            // Act
            var result = await service.CreatePriceAsync(1, request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Monthly", result.BillingCycle);
            Assert.Equal(100, result.Price);
            Assert.Equal(1, result.PlanId);
            var count = await context.PlanPrices.CountAsync();
            Assert.Equal(1, count);
        }

        [Fact]
        public async Task GetPricesByPlanIdAsync_ShouldReturnPricesForPlan()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            await service.CreatePriceAsync(1, new CreatePlanPriceRequest { BillingCycle = "Monthly", Price = 100 });
            await service.CreatePriceAsync(1, new CreatePlanPriceRequest { BillingCycle = "Yearly", Price = 1000 });
            await service.CreatePriceAsync(2, new CreatePlanPriceRequest { BillingCycle = "Monthly", Price = 200 });

            // Act
            var results = await service.GetPricesByPlanIdAsync(1);

            // Assert
            Assert.Equal(2, results.Count());
            Assert.All(results, r => Assert.Equal(1, r.PlanId));
        }

        [Fact]
        public async Task UpdatePriceAsync_ShouldModifyExistingPrice()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            
            var created = await service.CreatePriceAsync(1, new CreatePlanPriceRequest { BillingCycle = "Monthly", Price = 100 });
            
            var updateRequest = new UpdatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 120,
                PromotionId = null
            };

            // Act
            var result = await service.UpdatePriceAsync(1, created.Id, updateRequest);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(120, result.Price);
        }

        [Fact]
        public async Task UpdatePriceAsync_NonExistent_ShouldReturnNull()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            
            var updateRequest = new UpdatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 120,
                PromotionId = null
            };

            // Act
            var result = await service.UpdatePriceAsync(1, 999, updateRequest);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeletePriceAsync_ShouldSoftDelete()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            
            var created = await service.CreatePriceAsync(1, new CreatePlanPriceRequest { BillingCycle = "Monthly", Price = 100 });

            // Act
            var result = await service.DeletePriceAsync(1, created.Id);

            // Assert
            Assert.True(result);
            var allPrices = await context.PlanPrices.IgnoreQueryFilters().ToListAsync();
            var deletedPrice = allPrices.FirstOrDefault(p => p.Id == created.Id);
            Assert.NotNull(deletedPrice);
            Assert.False(deletedPrice.IsActive);
        }

        [Fact]
        public async Task CreatePriceAsync_WithPromotion_ShouldIncludePromotionInfo()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            
            var promotion = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Holiday Special",
                DiscountPercentage = 50,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(10)
            });

            var request = new CreatePlanPriceRequest
            {
                BillingCycle = "Yearly",
                Price = 1200,
                PromotionId = promotion.Id
            };

            // Act
            var result = await service.CreatePriceAsync(1, request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Holiday Special", result.PromotionName);
            Assert.Equal(50, result.DiscountPercentage);
        }
    }
}
