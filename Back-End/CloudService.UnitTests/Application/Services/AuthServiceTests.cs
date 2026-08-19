using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;
using CloudService.Application.DTOs.Auth;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;

using CloudService.Application.Interfaces;

namespace CloudService.UnitTests.Application.Services
{
    public class AuthServiceTests
    {
        private class FakeEmailService : IEmailService
        {
            public Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody) => Task.FromResult(true);
            public Task<bool> SendOtpResetPasswordAsync(string toEmail, string fullName, string otpCode) => Task.FromResult(true);
            public Task<bool> SendOrderSuccessNotificationAsync(string toEmail, string customerName, string orderCode, string planName, decimal price) => Task.FromResult(true);
        }

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

        private AuthService CreateAuthService(ApplicationDbContext context, JwtTokenGenerator tokenGen)
        {
            return new AuthService(context, tokenGen, new FakeEmailService());
        }

        [Fact]
        public async Task RegisterUserAsync_ShouldCreateUserSuccessfully()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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
            var authService = CreateAuthService(context, tokenGen);

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

        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnAllUsersWithRoles()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var adminRole = new Role { Id = 1, Name = "Admin", IsActive = true };
            var editorRole = new Role { Id = 2, Name = "Editor", IsActive = true };
            await context.Roles.AddRangeAsync(adminRole, editorRole);

            var user1 = new AppUser
            {
                Id = 1,
                Username = "admin_user",
                FullName = "Admin User",
                Email = "admin@example.com",
                PasswordHash = "hash1",
                RoleId = 1,
                Role = adminRole,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var user2 = new AppUser
            {
                Id = 2,
                Username = "editor_user",
                FullName = "Editor User",
                Email = "editor@example.com",
                PasswordHash = "hash2",
                RoleId = 2,
                Role = editorRole,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await context.AppUsers.AddRangeAsync(user1, user2);
            await context.SaveChangesAsync();

            var users = (await authService.GetAllUsersAsync()).ToList();

            Assert.Equal(2, users.Count);
            var u1 = users.FirstOrDefault(u => u.Username == "admin_user");
            Assert.NotNull(u1);
            Assert.Equal(1, u1.Id);
            Assert.Equal("Admin User", u1.FullName);
            Assert.Equal("admin@example.com", u1.Email);
            Assert.Equal("Admin", u1.Role);
            Assert.True(u1.IsActive);

            var u2 = users.FirstOrDefault(u => u.Username == "editor_user");
            Assert.NotNull(u2);
            Assert.Equal(2, u2.Id);
            Assert.Equal("Editor User", u2.FullName);
            Assert.Equal("editor@example.com", u2.Email);
            Assert.Equal("Editor", u2.Role);
            Assert.True(u2.IsActive);
        }

        [Fact]
        public async Task UpdateUserAsync_WithValidData_ShouldUpdateUserAndRole()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var adminRole = new Role { Id = 1, Name = "Admin", IsActive = true };
            var editorRole = new Role { Id = 2, Name = "Editor", IsActive = true };
            await context.Roles.AddRangeAsync(adminRole, editorRole);

            var user = new AppUser
            {
                Id = 1,
                Username = "user_to_update",
                FullName = "Old Name",
                Email = "old@example.com",
                PasswordHash = "hash",
                RoleId = 1,
                Role = adminRole,
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var updateReq = new UpdateUserRequest
            {
                FullName = "New Name",
                Email = "new@example.com",
                Role = "Editor",
                IsActive = false
            };

            var result = await authService.UpdateUserAsync(1, updateReq);

            Assert.True(result);
            var updatedUser = await context.AppUsers.FindAsync(1);
            Assert.NotNull(updatedUser);
            Assert.Equal("New Name", updatedUser.FullName);
            Assert.Equal("new@example.com", updatedUser.Email);
            Assert.Equal(2, updatedUser.RoleId);
            Assert.False(updatedUser.IsActive);
        }

        [Fact]
        public async Task UpdateUserAsync_WithInvalidRole_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var role = new Role { Id = 1, Name = "Admin", IsActive = true };
            await context.Roles.AddAsync(role);

            var user = new AppUser
            {
                Id = 1,
                Username = "user_invalid_role",
                FullName = "Original Name",
                Email = "orig@example.com",
                PasswordHash = "hash",
                RoleId = 1,
                Role = role,
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var updateReq = new UpdateUserRequest
            {
                FullName = "Changed Name",
                Email = "changed@example.com",
                Role = "NonExistentRole",
                IsActive = true
            };

            var result = await authService.UpdateUserAsync(1, updateReq);

            Assert.False(result);
            var unchangedUser = await context.AppUsers.FindAsync(1);
            Assert.NotNull(unchangedUser);
            Assert.Equal("Original Name", unchangedUser.FullName);
            Assert.Equal("orig@example.com", unchangedUser.Email);
            Assert.Equal(1, unchangedUser.RoleId);
        }

        [Fact]
        public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var role = new Role { Id = 1, Name = "Admin", IsActive = true };
            await context.Roles.AddAsync(role);
            await context.SaveChangesAsync();

            var updateReq = new UpdateUserRequest
            {
                FullName = "Any Name",
                Email = "any@example.com",
                Role = "Admin",
                IsActive = true
            };

            var result = await authService.UpdateUserAsync(999, updateReq);
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldSoftDeleteUser()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var user = new AppUser
            {
                Id = 10,
                Username = "user_to_delete",
                PasswordHash = "hash",
                Email = "del@example.com",
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var result = await authService.DeleteUserAsync(10);

            Assert.True(result);
            var deletedUser = await context.AppUsers.FindAsync(10);
            Assert.NotNull(deletedUser);
            Assert.False(deletedUser.IsActive);
        }

        [Fact]
        public async Task DeleteUserAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var result = await authService.DeleteUserAsync(999);
            Assert.False(result);
        }

        [Fact]
        public async Task ChangePasswordAsync_WithCorrectOldPassword_ShouldUpdatePassword()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var oldPass = "OldPassword123!";
            var newPass = "NewPassword456!";
            var user = new AppUser
            {
                Id = 20,
                Username = "user_change_pass",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass),
                Email = "changepass@example.com",
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var req = new ChangePasswordRequest
            {
                OldPassword = oldPass,
                NewPassword = newPass
            };

            var result = await authService.ChangePasswordAsync("user_change_pass", req);

            Assert.True(result);
            var updatedUser = await context.AppUsers.FindAsync(20);
            Assert.NotNull(updatedUser);
            Assert.True(BCrypt.Net.BCrypt.Verify(newPass, updatedUser.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(oldPass, updatedUser.PasswordHash));
        }

        [Fact]
        public async Task ChangePasswordAsync_WithIncorrectOldPassword_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var initialPass = "CorrectPassword123!";
            var initialHash = BCrypt.Net.BCrypt.HashPassword(initialPass);
            var user = new AppUser
            {
                Id = 21,
                Username = "user_wrong_pass",
                PasswordHash = initialHash,
                Email = "wrongpass@example.com",
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var req = new ChangePasswordRequest
            {
                OldPassword = "WrongPassword999!",
                NewPassword = "NewAttemptedPassword123!"
            };

            var result = await authService.ChangePasswordAsync("user_wrong_pass", req);

            Assert.False(result);
            var unchangedUser = await context.AppUsers.FindAsync(21);
            Assert.NotNull(unchangedUser);
            Assert.Equal(initialHash, unchangedUser.PasswordHash);
        }

        [Fact]
        public async Task ChangePasswordAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var req = new ChangePasswordRequest
            {
                OldPassword = "OldPassword123!",
                NewPassword = "NewPassword456!"
            };

            var result = await authService.ChangePasswordAsync("non_existent_user", req);
            Assert.False(result);
        }

        [Fact]
        public async Task AdminResetPasswordAsync_ShouldUpdatePasswordDirectly()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var oldPass = "UserOldPass123!";
            var newAdminPass = "AdminResetPass456!";
            var user = new AppUser
            {
                Id = 30,
                Username = "user_admin_reset",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(oldPass),
                Email = "adminreset@example.com",
                IsActive = true
            };
            await context.AppUsers.AddAsync(user);
            await context.SaveChangesAsync();

            var result = await authService.AdminResetPasswordAsync(30, newAdminPass);

            Assert.True(result);
            var updatedUser = await context.AppUsers.FindAsync(30);
            Assert.NotNull(updatedUser);
            Assert.True(BCrypt.Net.BCrypt.Verify(newAdminPass, updatedUser.PasswordHash));
            Assert.False(BCrypt.Net.BCrypt.Verify(oldPass, updatedUser.PasswordHash));
        }

        [Fact]
        public async Task AdminResetPasswordAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            var context = GetInMemoryDbContext();
            var config = GetMockConfiguration();
            var tokenGen = new JwtTokenGenerator(config);
            var authService = CreateAuthService(context, tokenGen);

            var result = await authService.AdminResetPasswordAsync(999, "NewPassword123!");
            Assert.False(result);
        }
    }
}
