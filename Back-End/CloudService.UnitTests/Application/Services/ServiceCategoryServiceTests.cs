using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using CloudService.Application.DTOs.Services;
using CloudService.Domain.Entities;
using System.Collections.Generic;
using System;

namespace CloudService.UnitTests.Application.Services
{
    public class ServiceCategoryServiceTests
    {
        private ApplicationDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnActiveCategoriesOnly()
        {
            // Arrange
            using var context = GetDbContext();
            var activeCat = new ServiceCategory { Id = 1, Name = "Cat 1", Slug = "cat-1" };
            var inactiveCat = new ServiceCategory { Id = 2, Name = "Cat 2", Slug = "cat-2" };
            
            context.ServiceCategories.AddRange(activeCat, inactiveCat);
            await context.SaveChangesAsync();
            
            // Now mark the second one as inactive
            inactiveCat.IsActive = false;
            await context.SaveChangesAsync();
            
            var service = new ServiceCategoryService(context);

            // Act
            var result = (await service.GetAllAsync()).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal("Cat 1", result.First().Name);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnCategory_WhenFoundAndActive()
        {
            // Arrange
            using var context = GetDbContext();
            context.ServiceCategories.Add(new ServiceCategory { Id = 1, Name = "Cat 1", Slug = "cat-1", IsActive = true });
            await context.SaveChangesAsync();

            var service = new ServiceCategoryService(context);

            // Act
            var result = await service.GetByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Cat 1", result.Name);
        }

        [Fact]
        public async Task CreateAsync_ShouldCreateNewCategory()
        {
            // Arrange
            using var context = GetDbContext();
            var service = new ServiceCategoryService(context);
            var request = new CreateServiceCategoryRequest { Name = "New Cat", Slug = "new-cat", Description = "Desc" };

            // Act
            var result = await service.CreateAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Cat", result.Name);
            Assert.Equal(1, context.ServiceCategories.Count());
        }

        [Fact]
        public async Task UpdateAsync_ShouldUpdateCategory_WhenFound()
        {
            // Arrange
            using var context = GetDbContext();
            context.ServiceCategories.Add(new ServiceCategory { Id = 1, Name = "Cat 1", Slug = "cat-1", Description = "Old" });
            await context.SaveChangesAsync();

            var service = new ServiceCategoryService(context);
            var request = new UpdateServiceCategoryRequest { Name = "Updated Cat", Slug = "updated-cat", Description = "New" };

            // Act
            var result = await service.UpdateAsync(1, request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Cat", result.Name);
            
            var dbCategory = await context.ServiceCategories.FindAsync(1);
            Assert.NotNull(dbCategory);
            Assert.Equal("Updated Cat", dbCategory.Name);
        }

        [Fact]
        public async Task DeleteAsync_ShouldSoftDeleteCategoryAndCascade()
        {
            // Arrange
            using var context = GetDbContext();
            var category = new ServiceCategory { Id = 1, Name = "Cat 1", Slug = "cat-1" };
            var plan = new ServicePlan { Id = 1, CategoryId = 1, Name = "Plan 1" };
            var price = new PlanPrice { Id = 1, PlanId = 1, Price = 100 };
            
            context.ServiceCategories.Add(category);
            context.ServicePlans.Add(plan);
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var service = new ServiceCategoryService(context);

            // Act
            var result = await service.DeleteAsync(1);

            // Assert
            Assert.True(result);
            
            // Should ignore query filter to check IsActive = false
            var dbCategory = await context.ServiceCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == 1);
            var dbPlan = await context.ServicePlans.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == 1);
            var dbPrice = await context.PlanPrices.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == 1);

            Assert.NotNull(dbCategory);
            Assert.NotNull(dbPlan);
            Assert.NotNull(dbPrice);
            Assert.False(dbCategory.IsActive);
            Assert.False(dbPlan.IsActive);
            Assert.False(dbPrice.IsActive);
        }
    }
}
