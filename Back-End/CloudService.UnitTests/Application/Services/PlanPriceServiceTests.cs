using System;
using System.Linq;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Services;
using CloudService.Domain.Entities;
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
        public async Task GetAllPromotionsAsync_WithActiveOnly_ShouldFilterExpired()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            // Active promo
            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Active Promo",
                DiscountPercentage = 20,
                StartDate = DateTime.UtcNow.AddDays(-5),
                EndDate = DateTime.UtcNow.AddDays(10)
            });

            // Expired promo
            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Expired Promo",
                DiscountPercentage = 50,
                StartDate = DateTime.UtcNow.AddDays(-20),
                EndDate = DateTime.UtcNow.AddDays(-1)
            });

            // Act
            var allPromos = await service.GetAllPromotionsAsync(activeOnly: false);
            var activePromos = await service.GetAllPromotionsAsync(activeOnly: true);

            // Assert
            Assert.Equal(2, allPromos.Count());
            Assert.Single(activePromos);
            Assert.Equal("Active Promo", activePromos.First().Name);
        }

        [Fact]
        public async Task ValidatePromotionAsync_ExpiredPromotion_ShouldReturnNull()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "EXPIRED2026",
                DiscountPercentage = 30,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(-1)
            });

            // Act
            var result = await service.ValidatePromotionAsync("EXPIRED2026");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task ValidatePromotionAsync_ActivePromotion_ShouldReturnDto()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "ACTIVE2026",
                DiscountPercentage = 25,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(15)
            });

            // Act
            var result = await service.ValidatePromotionAsync("ACTIVE2026");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("ACTIVE2026", result.Name);
            Assert.Equal(25, result.DiscountPercentage);
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
                StartDate = DateTime.UtcNow.AddDays(-1),
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

        [Fact]
        public async Task GetPricesByPlanIdAsync_WithExpiredPromotion_ShouldNotApplyDiscount()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);
            
            var expiredPromo = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "Expired Holiday",
                DiscountPercentage = 50,
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(-5)
            });

            await service.CreatePriceAsync(1, new CreatePlanPriceRequest
            {
                BillingCycle = "Yearly",
                Price = 1000,
                PromotionId = expiredPromo.Id
            });

            // Act
            var prices = (await service.GetPricesByPlanIdAsync(1)).ToList();

            // Assert
            Assert.Single(prices);
            Assert.Null(prices[0].PromotionName);
            Assert.Null(prices[0].DiscountPercentage);
        }

        [Fact]
        public async Task GetPromotionsByPlanIdAsync_ShouldReturnOnlyPromotionsLinkedToSpecificPlan()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var promoPlan1 = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "VPSPRO10",
                DiscountPercentage = 10,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            var promoPlan2 = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "HOSTING15",
                DiscountPercentage = 15,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            // Gán promoPlan1 cho Plan 1
            await service.CreatePriceAsync(1, new CreatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 200,
                PromotionId = promoPlan1.Id
            });

            // Gán promoPlan2 cho Plan 2
            await service.CreatePriceAsync(2, new CreatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 100,
                PromotionId = promoPlan2.Id
            });

            // Act
            var plan1Promos = (await service.GetPromotionsByPlanIdAsync(1, activeOnly: true)).ToList();
            var plan2Promos = (await service.GetPromotionsByPlanIdAsync(2, activeOnly: true)).ToList();

            // Assert
            Assert.Single(plan1Promos);
            Assert.Equal("VPSPRO10", plan1Promos[0].Name);

            Assert.Single(plan2Promos);
            Assert.Equal("HOSTING15", plan2Promos[0].Name);
        }

        [Fact]
        public async Task ValidatePromotionForPlanAsync_WhenCodeBelongsToPlan_ShouldReturnSuccess()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var promo = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "VPSPRO10",
                DiscountPercentage = 10,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            await service.CreatePriceAsync(1, new CreatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 200,
                PromotionId = promo.Id
            });

            // Act
            var (validPromo, errorMsg) = await service.ValidatePromotionForPlanAsync("VPSPRO10", 1);

            // Assert
            Assert.NotNull(validPromo);
            Assert.Null(errorMsg);
            Assert.Equal("VPSPRO10", validPromo.Name);
            Assert.Equal(10, validPromo.DiscountPercentage);
        }

        [Fact]
        public async Task ValidatePromotionForPlanAsync_WhenCodeBelongsToOtherPlan_ShouldReturnErrorMessage()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var promo = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "HOSTING15",
                DiscountPercentage = 15,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            // Gán promo HOSTING15 cho Plan 2 (Hosting)
            await service.CreatePriceAsync(2, new CreatePlanPriceRequest
            {
                BillingCycle = "Monthly",
                Price = 100,
                PromotionId = promo.Id
            });

            // Act: Cố tình áp dụng HOSTING15 cho Plan 1 (VPS)
            var (validPromo, errorMsg) = await service.ValidatePromotionForPlanAsync("HOSTING15", 1);

            // Assert
            Assert.Null(validPromo);
            Assert.NotNull(errorMsg);
            Assert.Contains("không áp dụng cho", errorMsg);
        }

        [Fact]
        public async Task AddPromotionToPlanAsync_ShouldAddMultiplePromotionsToPlan()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var plan = new ServicePlan { Id = 10, Name = "Plan Multi Promo" };
            await context.ServicePlans.AddAsync(plan);
            await context.SaveChangesAsync();

            var promo1 = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "PROMO1",
                DiscountPercentage = 10,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            var promo2 = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "PROMO2",
                DiscountPercentage = 20,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            // Act
            var added1 = await service.AddPromotionToPlanAsync(10, promo1.Id);
            var added2 = await service.AddPromotionToPlanAsync(10, promo2.Id);

            var planPromos = (await service.GetPromotionsByPlanIdAsync(10, activeOnly: true)).ToList();

            // Assert
            Assert.True(added1);
            Assert.True(added2);
            Assert.Equal(2, planPromos.Count);
            Assert.Contains(planPromos, p => p.Name == "PROMO1");
            Assert.Contains(planPromos, p => p.Name == "PROMO2");

            // Xác thực cả 2 mã đều hợp lệ cho plan 10
            var (v1, e1) = await service.ValidatePromotionForPlanAsync("PROMO1", 10);
            var (v2, e2) = await service.ValidatePromotionForPlanAsync("PROMO2", 10);
            Assert.NotNull(v1);
            Assert.Null(e1);
            Assert.NotNull(v2);
            Assert.Null(e2);
        }

        [Fact]
        public async Task RemovePromotionFromPlanAsync_ShouldRemovePromoFromPlanList()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var plan = new ServicePlan { Id = 11, Name = "Plan Remove Promo" };
            await context.ServicePlans.AddAsync(plan);
            await context.SaveChangesAsync();

            var promo = await service.CreatePromotionAsync(new CreatePromotionRequest
            {
                Name = "PROMO_TO_REMOVE",
                DiscountPercentage = 15,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(30)
            });

            await service.AddPromotionToPlanAsync(11, promo.Id);

            // Act
            var removed = await service.RemovePromotionFromPlanAsync(11, promo.Id);
            var planPromos = (await service.GetPromotionsByPlanIdAsync(11)).ToList();

            // Assert
            Assert.True(removed);
            Assert.Empty(planPromos);

            // Xác thực sau khi gỡ sẽ bị báo lỗi không áp dụng được
            var (v, err) = await service.ValidatePromotionForPlanAsync("PROMO_TO_REMOVE", 11);
            Assert.Null(v);
            Assert.NotNull(err);
        }

        [Fact]
        public async Task SetPlanPromotionsAsync_ShouldReplaceExistingPromos()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            using var context = GetDbContext(dbName);
            var service = new PlanPriceService(context);

            var plan = new ServicePlan { Id = 12, Name = "Plan Batch Set" };
            await context.ServicePlans.AddAsync(plan);
            await context.SaveChangesAsync();

            var p1 = await service.CreatePromotionAsync(new CreatePromotionRequest { Name = "BATCH1", DiscountPercentage = 5 });
            var p2 = await service.CreatePromotionAsync(new CreatePromotionRequest { Name = "BATCH2", DiscountPercentage = 10 });
            var p3 = await service.CreatePromotionAsync(new CreatePromotionRequest { Name = "BATCH3", DiscountPercentage = 15 });

            // Ban đầu gán p1
            await service.AddPromotionToPlanAsync(12, p1.Id);

            // Act: Set danh sách mới thành [p2, p3]
            var success = await service.SetPlanPromotionsAsync(12, new[] { p2.Id, p3.Id });
            var planPromos = (await service.GetPromotionsByPlanIdAsync(12)).ToList();

            // Assert
            Assert.True(success);
            Assert.Equal(2, planPromos.Count);
            Assert.DoesNotContain(planPromos, p => p.Name == "BATCH1");
            Assert.Contains(planPromos, p => p.Name == "BATCH2");
            Assert.Contains(planPromos, p => p.Name == "BATCH3");
        }
    }
}
