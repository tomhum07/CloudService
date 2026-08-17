using System;
using System.Threading.Tasks;
using CloudService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Data
{
    public class DbInitializerTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task SeedAsync_ShouldSeedRolesAndDefaultAdminUser_WhenDatabaseIsEmpty()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            using (var context = new ApplicationDbContext(options))
            {
                // Act
                await DbInitializer.SeedAsync(context);
            }

            // Assert - verify seeded data in a separate context instance
            using (var context = new ApplicationDbContext(options))
            {
                var roles = await context.Roles.ToListAsync();
                Assert.Equal(3, roles.Count);
                Assert.Contains(roles, r => r.Name == "Admin" && r.Description == "Quản trị viên tối cao");
                Assert.Contains(roles, r => r.Name == "Editor" && r.Description == "Biên tập viên nội dung");
                Assert.Contains(roles, r => r.Name == "Customer" && r.Description == "Khách hàng sử dụng dịch vụ");

                var adminUser = await context.AppUsers.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == "admin");
                Assert.NotNull(adminUser);
                Assert.Equal("Hệ thống Admin", adminUser.FullName);
                Assert.Equal("admin@cloudservice.com", adminUser.Email);
                Assert.NotNull(adminUser.Role);
                Assert.Equal("Admin", adminUser.Role.Name);
                Assert.True(BCrypt.Net.BCrypt.Verify("123123", adminUser.PasswordHash));
            }
        }

        [Fact]
        public async Task SeedAsync_ShouldNotDuplicateData_WhenCalledMultipleTimes()
        {
            // Arrange
            var dbName = Guid.NewGuid().ToString();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            using (var context = new ApplicationDbContext(options))
            {
                await DbInitializer.SeedAsync(context);
            }

            // Act - Second call to SeedAsync
            using (var context = new ApplicationDbContext(options))
            {
                await DbInitializer.SeedAsync(context);
            }

            // Assert
            using (var context = new ApplicationDbContext(options))
            {
                var roleCount = await context.Roles.CountAsync();
                var userCount = await context.AppUsers.CountAsync();

                Assert.Equal(3, roleCount);
                Assert.Equal(5, userCount);
            }
        }
    }
}
