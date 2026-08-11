using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

using CloudService.Application.DTOs.Services;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using System.Collections.Generic;

namespace CloudService.UnitTests.Application.Services
{
    public class ServicePlanServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly ServicePlanService _service;

        public ServicePlanServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);

            var inMemorySettings = new Dictionary<string, string?> {
                {"FrontendUrl", "https://test.com"}
            };
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            _service = new ServicePlanService(_context, configuration);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Fact]
        public async Task CreateAsync_ShouldCreatePlanAndGenerateQrCode()
        {
            // Arrange
            var category = new ServiceCategory { Name = "Test Category" };
            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            var request = new CreateServicePlanRequest
            {
                CategoryId = category.Id,
                Name = "Test Plan",
                Description = "Description",
                Cpu = "1 Core",
                Ram = "1 GB",
                Storage = "10 GB",
                Bandwidth = "1 TB"
            };

            // Act
            var result = await _service.CreateAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(request.Name, result.Name);
            Assert.True(result.IsActive);
            Assert.NotNull(result.QrCodeUrl);
            Assert.Contains("chart.googleapis.com", result.QrCodeUrl);
            Assert.Contains(Uri.EscapeDataString($"https://test.com/plans/{result.Id}"), result.QrCodeUrl);
            
            var planInDb = await _context.ServicePlans.FindAsync(result.Id);
            Assert.NotNull(planInDb);
            Assert.Equal(request.Name, planInDb.Name);
        }

        [Fact]
        public async Task UpdateAsync_ShouldUpdatePlan()
        {
            // Arrange
            var category = new ServiceCategory { Name = "Test Category" };
            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();

            var plan = new ServicePlan
            {
                CategoryId = category.Id,
                Name = "Old Name",
                Description = "Old Description",
                IsActive = true
            };
            _context.ServicePlans.Add(plan);
            await _context.SaveChangesAsync();

            var request = new UpdateServicePlanRequest
            {
                Name = "New Name",
                Description = "New Description"
            };

            // Act
            var result = await _service.UpdateAsync(plan.Id, request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            
            var planInDb = await _context.ServicePlans.FindAsync(plan.Id);
            Assert.NotNull(planInDb);
            Assert.Equal("New Name", planInDb.Name);
        }

        [Fact]
        public async Task DeleteAsync_ShouldSoftDeletePlanAndPrices()
        {
            // Arrange
            var category = new ServiceCategory { Name = "Test Category" };
            var plan = new ServicePlan { CategoryId = 1, Name = "Test Plan", IsActive = true };
            var price1 = new PlanPrice { PlanId = 1, BillingCycle = "Monthly", Price = 10, IsActive = true };
            var price2 = new PlanPrice { PlanId = 1, BillingCycle = "Yearly", Price = 100, IsActive = true };
            
            plan.Prices.Add(price1);
            plan.Prices.Add(price2);

            _context.ServiceCategories.Add(category);
            _context.ServicePlans.Add(plan);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteAsync(plan.Id);

            // Assert
            Assert.True(result);
            
            var deletedPlan = await _context.ServicePlans.IgnoreQueryFilters().Include(p => p.Prices).FirstOrDefaultAsync(p => p.Id == plan.Id);
            Assert.NotNull(deletedPlan);
            Assert.False(deletedPlan.IsActive);
            Assert.All(deletedPlan.Prices, p => Assert.False(p.IsActive));
        }

        [Fact]
        public async Task GetPagedAsync_ShouldReturnPagedAndFilteredAndSortedData()
        {
            // Arrange
            var category1 = new ServiceCategory { Name = "Category 1" };
            var category2 = new ServiceCategory { Name = "Category 2" };
            _context.ServiceCategories.AddRange(category1, category2);
            await _context.SaveChangesAsync();

            var plan1 = new ServicePlan { CategoryId = category1.Id, Name = "Alpha Plan", Description = "Test", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-2) };
            var plan2 = new ServicePlan { CategoryId = category2.Id, Name = "Beta Plan", Description = "Test", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-1) };
            var plan3 = new ServicePlan { CategoryId = category1.Id, Name = "Gamma Plan", Description = "Other", IsActive = true, CreatedAt = DateTime.UtcNow };
            
            plan1.Prices.Add(new PlanPrice { Price = 20, IsActive = true });
            plan2.Prices.Add(new PlanPrice { Price = 10, IsActive = true });
            plan3.Prices.Add(new PlanPrice { Price = 30, IsActive = true });
            
            var inactivePrice = new PlanPrice { Price = 5, IsActive = true };
            plan3.Prices.Add(inactivePrice);

            _context.ServicePlans.AddRange(plan1, plan2, plan3);
            await _context.SaveChangesAsync();

            inactivePrice.IsActive = false;
            await _context.SaveChangesAsync();

            // Act 1: Pagination
            var pagedResult = await _service.GetPagedAsync(1, 2, null, null, null);
            Assert.Equal(3, pagedResult.TotalItems);
            Assert.Equal(2, pagedResult.Items.Count());

            // Act 2: Filtering by Category
            var catResult = await _service.GetPagedAsync(1, 10, category1.Id, null, null);
            Assert.Equal(2, catResult.TotalItems);
            Assert.All(catResult.Items, i => Assert.Equal(category1.Id, i.CategoryId));

            // Act 3: Searching
            var searchResult = await _service.GetPagedAsync(1, 10, null, "Other", null);
            Assert.Equal(1, searchResult.TotalItems);
            Assert.Equal("Gamma Plan", searchResult.Items.First().Name);

            // Act 4: Sorting by Name
            var nameSortResult = await _service.GetPagedAsync(1, 10, null, null, "name");
            Assert.Equal("Alpha Plan", nameSortResult.Items.First().Name);

            // Act 5: Sorting by Price
            var priceSortResult = await _service.GetPagedAsync(1, 10, null, null, "price");
            Assert.Equal("Beta Plan", priceSortResult.Items.First().Name);
        }
    }
}
