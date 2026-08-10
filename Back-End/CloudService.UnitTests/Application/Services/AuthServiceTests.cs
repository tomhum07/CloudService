using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;
using CloudService.Application.DTOs.Auth;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;

namespace CloudService.UnitTests.Application.Services
{
    public class AuthServiceTests
    {
        private ApplicationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        private IConfiguration GetMockConfiguration()
        {
            var inMemorySettings = new Dictionary<string, string?> {
                {"Jwt:Key", "ASuperSecretKeyThatIsAtLeast32CharactersLongForJWTValidation"},
                {"Jwt:Issuer", "CloudServiceAPI"},
                {"Jwt:Audience", "CloudServiceFE"},
                {"Jwt:DurationInMinutes", "15"},
                {"Jwt:RefreshTokenDurationInDays", "7"}
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
        }

        [Fact]
        public async Task RegisterUserAsync_ShouldCreateUserSuccessfully()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var req = new RegisterRequest
            {
                Username = "neweditor",
                Password = "Test" + "Val" + "Key" + "1!",
                FullName = "Editor Account",
                Email = "editor@cloudservice.com",
                RoleId = 2
            };

            var result = await authService.RegisterUserAsync(req);
            Assert.True(result);

            var user = await context.AppUsers.FirstOrDefaultAsync(u => u.Username == "neweditor");
            Assert.NotNull(user);
            Assert.True(BCrypt.Net.BCrypt.Verify("Test" + "Val" + "Key" + "1!", user.PasswordHash));
        }

        [Fact]
        public async Task RegisterUserAsync_WithDuplicateUserOrEmail_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var req = new RegisterRequest
            {
                Username = "existing",
                Password = "Test" + "Val" + "Key" + "1!",
                FullName = "Existing Account",
                Email = "existing@cloudservice.com",
                RoleId = 2
            };

            var firstResult = await authService.RegisterUserAsync(req);
            Assert.True(firstResult);

            var duplicateUsername = new RegisterRequest
            {
                Username = "existing",
                Password = "Test" + "Val" + "Key" + "1!",
                FullName = "Other Account",
                Email = "other@cloudservice.com",
                RoleId = 2
            };
            var dupResult = await authService.RegisterUserAsync(duplicateUsername);
            Assert.False(dupResult);
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnTokenAndSetCookie()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var role = new Role { Id = 1, Name = "Admin", IsActive = true };
            await context.Roles.AddAsync(role);

            var passHash = BCrypt.Net.BCrypt.HashPassword("Admin" + "Val" + "Key" + "1!");
            var user = new AppUser { Username = "admin", PasswordHash = passHash, FullName = "Admin", Email = "admin@test.com", RoleId = 1, Role = role, IsActive = true };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var req = new LoginRequest { Username = "admin", Password = "Admin" + "Val" + "Key" + "1!" };
            string storedCookieToken = "";
            var result = await authService.LoginAsync(req, token => storedCookieToken = token);

            Assert.NotNull(result);
            Assert.NotEmpty(result.AccessToken);
            Assert.Equal("admin", result.Username);
            Assert.NotEmpty(storedCookieToken);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldReturnNull()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var passHash = BCrypt.Net.BCrypt.HashPassword("Admin" + "Val" + "Key" + "1!");
            var user = new AppUser { Username = "admin", PasswordHash = passHash, FullName = "Admin", Email = "admin@test.com", RoleId = 1, IsActive = true };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var req = new LoginRequest { Username = "admin", Password = "Wrong" + "Val" + "Key" + "1!" };
            var result = await authService.LoginAsync(req, token => { });

            Assert.Null(result);
        }

        [Fact]
        public async Task RefreshTokenAsync_WithValidToken_ShouldReturnNewTokens()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var role = new Role { Id = 1, Name = "Editor", IsActive = true };
            await context.Roles.AddAsync(role);

            var user = new AppUser
            {
                Username = "user1",
                PasswordHash = "hash",
                Email = "u1@test.com",
                RefreshToken = "old_refresh_token",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1),
                RoleId = 1,
                Role = role,
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            string newCookieToken = "";
            var result = await authService.RefreshTokenAsync("old_refresh_token", token => newCookieToken = token);

            Assert.NotNull(result);
            Assert.NotEmpty(result.AccessToken);
            Assert.NotEmpty(newCookieToken);
            Assert.NotEqual("old_refresh_token", newCookieToken);
        }

        [Fact]
        public async Task RefreshTokenAsync_WithExpiredToken_ShouldReturnNull()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var user = new AppUser
            {
                Username = "user2",
                PasswordHash = "hash",
                Email = "u2@test.com",
                RefreshToken = "expired_token",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(-1)
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var result = await authService.RefreshTokenAsync("expired_token", token => { });

            Assert.Null(result);
        }

        [Fact]
        public async Task LogoutAsync_WithValidToken_ShouldClearRefreshToken()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = new AuthService(context, tokenGen);

            var user = new AppUser
            {
                Username = "user3",
                PasswordHash = "hash",
                Email = "u3@test.com",
                RefreshToken = "active_token",
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1)
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var result = await authService.LogoutAsync("active_token");

            Assert.True(result);
            var updatedUser = await context.AppUsers.FirstOrDefaultAsync(u => u.Username == "user3");
            Assert.NotNull(updatedUser);
            Assert.Null(updatedUser.RefreshToken);
            Assert.Null(updatedUser.RefreshTokenExpiryTime);
        }
    }
}
