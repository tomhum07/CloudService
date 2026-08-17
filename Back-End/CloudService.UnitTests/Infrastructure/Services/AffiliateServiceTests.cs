using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Affiliates;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Services
{
    public class AffiliateServiceTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task CreateApplicationAsync_ShouldCreateSuccessfully()
        {
            using var context = CreateInMemoryDbContext();
            var service = new AffiliateService(context);

            var dto = new CreateAffiliateApplicationDto
            {
                FullName = "Phạm Affiliate",
                Email = "affiliate@example.com",
                Phone = "0988888888",
                WebsiteUrl = "https://youtube.com/c/techreview",
                Motivation = "Tôi có kênh review công nghệ với 50k sub"
            };

            var result = await service.CreateApplicationAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("Phạm Affiliate", result.FullName);
            Assert.Equal(0, result.Status); // New
            Assert.Equal("Chờ duyệt", result.StatusName);
        }

        [Fact]
        public async Task UpdateStatusAsync_ShouldApproveAffiliate()
        {
            using var context = CreateInMemoryDbContext();
            var app = new AffiliateApplication
            {
                FullName = "Trần Đối Tác",
                Email = "partner@gmail.com",
                Phone = "0977777777",
                Status = 0
            };
            context.AffiliateApplications.Add(app);
            await context.SaveChangesAsync();

            var service = new AffiliateService(context);
            var result = await service.UpdateStatusAsync(app.Id, new UpdateAffiliateStatusDto { Status = 2 });

            Assert.NotNull(result);
            Assert.Equal(2, result.Status);
            Assert.Equal("Đã duyệt", result.StatusName);
        }
    }
}
