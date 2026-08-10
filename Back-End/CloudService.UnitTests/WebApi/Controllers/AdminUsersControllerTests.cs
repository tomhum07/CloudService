using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Controllers;

namespace CloudService.UnitTests.WebApi.Controllers
{
    public class AdminUsersControllerTests
    {
        private class FakeAuthService : IAuthService
        {
            public System.Func<RegisterRequest, Task<bool>>? RegisterUserHandler { get; set; }

            public Task<AuthResponse?> LoginAsync(LoginRequest request, System.Action<string> setRefreshTokenCookie) => throw new System.NotImplementedException();
            public Task<AuthResponse?> RefreshTokenAsync(string refreshToken, System.Action<string> setRefreshTokenCookie) => throw new System.NotImplementedException();
            public Task<bool> LogoutAsync(string refreshToken) => throw new System.NotImplementedException();

            public Task<bool> RegisterUserAsync(RegisterRequest request)
            {
                if (RegisterUserHandler != null) return RegisterUserHandler(request);
                return Task.FromResult(true);
            }
        }

        [Fact]
        public async Task CreateUser_Success_ReturnsOk()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                RegisterUserHandler = req => Task.FromResult(true)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new RegisterRequest
            {
                Username = "adminuser",
                Password = "Test" + "Val" + "Key" + "1!",
                FullName = "Admin Account",
                Email = "admin@example.com",
                RoleId = 1
            };

            // Act
            var result = await controller.CreateUser(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateUser_DuplicateUser_ReturnsBadRequest()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                RegisterUserHandler = req => Task.FromResult(false)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new RegisterRequest
            {
                Username = "existinguser",
                Password = "Test" + "Val" + "Key" + "1!",
                FullName = "Existing Account",
                Email = "existing@example.com",
                RoleId = 1
            };

            // Act
            var result = await controller.CreateUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }
    }
}
