using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Services
{
    public class AuditLogServiceTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task LogAsync_ShouldCreateAuditLogWithCorrectType()
        {
            using var context = CreateInMemoryDbContext();
            var service = new AuditLogService(context);

            var result = await service.LogAsync("admin@cloudservice.com", "Đăng nhập hệ thống quản trị thành công", "IP: 127.0.0.1");

            Assert.NotNull(result);
            Assert.Equal("admin@cloudservice.com", result.Username);
            Assert.Equal("Bảo Mật", result.Type);
            Assert.Equal("Thành công", result.Status);

            var logs = await service.GetLogsAsync();
            Assert.Equal(1, logs.TotalItems);
        }
    }
}
