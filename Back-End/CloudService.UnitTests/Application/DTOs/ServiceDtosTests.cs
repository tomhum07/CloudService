using System;
using System.Linq;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Services;
using Xunit;

namespace CloudService.UnitTests.Application.DTOs
{
    public class ServiceDtosTests
    {
        [Fact]
        public void ServiceCategoryDto_Initialization_ShouldSetPropertiesCorrectly()
        {
            var now = DateTime.UtcNow;
            var dto = new ServiceCategoryDto
            {
                Id = 1,
                Name = "Cloud VPS",
                Slug = "cloud-vps",
                Description = "High performance VPS",
                IsActive = true,
                CreatedAt = now
            };

            Assert.Equal(1, dto.Id);
            Assert.Equal("Cloud VPS", dto.Name);
            Assert.Equal("cloud-vps", dto.Slug);
            Assert.Equal("High performance VPS", dto.Description);
            Assert.True(dto.IsActive);
            Assert.Equal(now, dto.CreatedAt);
        }

        [Fact]
        public void CreateServiceCategoryRequest_Initialization_ShouldSetProperties()
        {
            var req = new CreateServiceCategoryRequest
            {
                Name = "Web Hosting",
                Slug = "web-hosting",
                Description = "Fast web hosting"
            };

            Assert.Equal("Web Hosting", req.Name);
            Assert.Equal("web-hosting", req.Slug);
            Assert.Equal("Fast web hosting", req.Description);
        }

        [Fact]
        public void UpdateServiceCategoryRequest_Initialization_ShouldSetProperties()
        {
            var req = new UpdateServiceCategoryRequest
            {
                Name = "Updated Name",
                Slug = "updated-slug",
                Description = "Updated desc"
            };

            Assert.Equal("Updated Name", req.Name);
            Assert.Equal("updated-slug", req.Slug);
            Assert.Equal("Updated desc", req.Description);
        }

        [Fact]
        public void ServicePlanDto_Initialization_ShouldSetProperties()
        {
            var now = DateTime.UtcNow;
            var dto = new ServicePlanDto
            {
                Id = 10,
                CategoryId = 1,
                CategoryName = "Cloud VPS",
                Name = "VPS Gold",
                Description = "Gold Plan",
                Cpu = "4 vCPU",
                Ram = "8 GB",
                Storage = "100 GB SSD",
                Bandwidth = "1 TB",
                QrCodeUrl = "http://example.com/qr.png",
                IsActive = true,
                CreatedAt = now
            };

            Assert.Equal(10, dto.Id);
            Assert.Equal(1, dto.CategoryId);
            Assert.Equal("Cloud VPS", dto.CategoryName);
            Assert.Equal("VPS Gold", dto.Name);
            Assert.Equal("Gold Plan", dto.Description);
            Assert.Equal("4 vCPU", dto.Cpu);
            Assert.Equal("8 GB", dto.Ram);
            Assert.Equal("100 GB SSD", dto.Storage);
            Assert.Equal("1 TB", dto.Bandwidth);
            Assert.Equal("http://example.com/qr.png", dto.QrCodeUrl);
            Assert.True(dto.IsActive);
            Assert.Equal(now, dto.CreatedAt);
        }

        [Fact]
        public void CreateServicePlanRequest_Initialization_ShouldSetProperties()
        {
            var req = new CreateServicePlanRequest
            {
                CategoryId = 2,
                Name = "VPS Silver",
                Description = "Silver Plan",
                Cpu = "2 vCPU",
                Ram = "4 GB",
                Storage = "50 GB SSD",
                Bandwidth = "500 GB"
            };

            Assert.Equal(2, req.CategoryId);
            Assert.Equal("VPS Silver", req.Name);
            Assert.Equal("Silver Plan", req.Description);
            Assert.Equal("2 vCPU", req.Cpu);
            Assert.Equal("4 GB", req.Ram);
            Assert.Equal("50 GB SSD", req.Storage);
            Assert.Equal("500 GB", req.Bandwidth);
        }

        [Fact]
        public void UpdateServicePlanRequest_Initialization_ShouldSetProperties()
        {
            var req = new UpdateServicePlanRequest
            {
                Name = "VPS Silver Updated",
                Description = "New desc",
                Cpu = "2 vCPU",
                Ram = "6 GB",
                Storage = "60 GB SSD",
                Bandwidth = "600 GB"
            };

            Assert.Equal("VPS Silver Updated", req.Name);
            Assert.Equal("New desc", req.Description);
            Assert.Equal("6 GB", req.Ram);
        }

        [Fact]
        public void PlanPriceDto_Initialization_ShouldSetProperties()
        {
            var dto = new PlanPriceDto
            {
                Id = 100,
                PlanId = 10,
                BillingCycle = "Monthly",
                Price = 150000m,
                PromotionId = 5,
                PromotionName = "Summer Sale",
                DiscountPercentage = 10m,
                IsActive = true
            };

            Assert.Equal(100, dto.Id);
            Assert.Equal(10, dto.PlanId);
            Assert.Equal("Monthly", dto.BillingCycle);
            Assert.Equal(150000m, dto.Price);
            Assert.Equal(5, dto.PromotionId);
            Assert.Equal("Summer Sale", dto.PromotionName);
            Assert.Equal(10m, dto.DiscountPercentage);
            Assert.True(dto.IsActive);
        }

        [Fact]
        public void CreatePlanPriceRequest_And_UpdatePlanPriceRequest_ShouldSetProperties()
        {
            var createReq = new CreatePlanPriceRequest
            {
                BillingCycle = "Yearly",
                Price = 1500000m,
                PromotionId = null
            };

            Assert.Equal("Yearly", createReq.BillingCycle);
            Assert.Equal(1500000m, createReq.Price);
            Assert.Null(createReq.PromotionId);

            var updateReq = new UpdatePlanPriceRequest
            {
                BillingCycle = "Yearly",
                Price = 1400000m,
                PromotionId = 1
            };

            Assert.Equal("Yearly", updateReq.BillingCycle);
            Assert.Equal(1400000m, updateReq.Price);
            Assert.Equal(1, updateReq.PromotionId);
        }

        [Fact]
        public void PromotionDto_And_CreatePromotionRequest_ShouldSetProperties()
        {
            var start = DateTime.UtcNow;
            var end = start.AddDays(30);

            var dto = new PromotionDto
            {
                Id = 1,
                Name = "Black Friday",
                DiscountPercentage = 20m,
                StartDate = start,
                EndDate = end,
                IsActive = true
            };

            Assert.Equal(1, dto.Id);
            Assert.Equal("Black Friday", dto.Name);
            Assert.Equal(20m, dto.DiscountPercentage);
            Assert.Equal(start, dto.StartDate);
            Assert.Equal(end, dto.EndDate);
            Assert.True(dto.IsActive);

            var createReq = new CreatePromotionRequest
            {
                Name = "Black Friday 2",
                DiscountPercentage = 25m,
                StartDate = start,
                EndDate = end
            };

            Assert.Equal("Black Friday 2", createReq.Name);
            Assert.Equal(25m, createReq.DiscountPercentage);
        }

        [Fact]
        public void PagedResult_TotalPagesCalculation_ShouldBeCorrect()
        {
            var paged = new PagedResult<int>
            {
                Items = new[] { 1, 2, 3, 4, 5 },
                TotalItems = 25,
                PageNumber = 1,
                PageSize = 10
            };

            Assert.Equal(3, paged.TotalPages);
            Assert.Equal(5, paged.Items.Count());
        }
    }
}
