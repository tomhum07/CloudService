using System.Collections.Generic;
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
            public System.Func<Task<IEnumerable<UserDto>>>? GetAllUsersHandler { get; set; }
            public System.Func<int, UpdateUserRequest, Task<bool>>? UpdateUserHandler { get; set; }
            public System.Func<int, Task<bool>>? DeleteUserHandler { get; set; }
            public System.Func<int, string, Task<bool>>? AdminResetPasswordHandler { get; set; }

            public Task<AuthResponse?> LoginAsync(LoginRequest request, System.Action<string> setRefreshTokenCookie) => throw new System.NotImplementedException();
            public Task<AuthResponse?> RefreshTokenAsync(string refreshToken, System.Action<string> setRefreshTokenCookie) => throw new System.NotImplementedException();
            public Task<bool> LogoutAsync(string refreshToken) => throw new System.NotImplementedException();

            public Task<bool> RegisterUserAsync(RegisterRequest request)
            {
                if (RegisterUserHandler != null) return RegisterUserHandler(request);
                return Task.FromResult(true);
            }

            public Task<IEnumerable<UserDto>> GetAllUsersAsync()
            {
                if (GetAllUsersHandler != null) return GetAllUsersHandler();
                return Task.FromResult<IEnumerable<UserDto>>(new List<UserDto>());
            }

            public Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
            {
                if (UpdateUserHandler != null) return UpdateUserHandler(id, request);
                return Task.FromResult(true);
            }

            public Task<bool> DeleteUserAsync(int id)
            {
                if (DeleteUserHandler != null) return DeleteUserHandler(id);
                return Task.FromResult(true);
            }

            public Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request) => Task.FromResult(true);

            public Task<bool> AdminResetPasswordAsync(int id, string newPassword)
            {
                if (AdminResetPasswordHandler != null) return AdminResetPasswordHandler(id, newPassword);
                return Task.FromResult(true);
            }
        }

        [Fact]
        public async Task GetAllUsers_ReturnsOkWithUsers()
        {
            // Arrange
            var expectedUsers = new List<UserDto>
            {
                new UserDto { Id = 1, Username = "user1", FullName = "User One", Email = "u1@example.com", Role = "Admin", IsActive = true },
                new UserDto { Id = 2, Username = "user2", FullName = "User Two", Email = "u2@example.com", Role = "Editor", IsActive = true }
            };
            var fakeService = new FakeAuthService
            {
                GetAllUsersHandler = () => Task.FromResult<IEnumerable<UserDto>>(expectedUsers)
            };
            var controller = new AdminUsersController(fakeService);

            // Act
            var result = await controller.GetAllUsers();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedUsers = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
            Assert.Equal(2, (returnedUsers as List<UserDto>)?.Count);
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

        [Fact]
        public async Task UpdateUser_Success_ReturnsOk()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                UpdateUserHandler = (id, req) => Task.FromResult(true)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new UpdateUserRequest
            {
                FullName = "Updated Name",
                Email = "updated@example.com",
                Role = "Editor",
                IsActive = true
            };

            // Act
            var result = await controller.UpdateUser(1, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateUser_Failure_ReturnsBadRequest()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                UpdateUserHandler = (id, req) => Task.FromResult(false)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new UpdateUserRequest
            {
                FullName = "Updated Name",
                Email = "updated@example.com",
                Role = "InvalidRole",
                IsActive = true
            };

            // Act
            var result = await controller.UpdateUser(1, request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task DeleteUser_Success_ReturnsOk()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                DeleteUserHandler = id => Task.FromResult(true)
            };
            var controller = new AdminUsersController(fakeService);

            // Act
            var result = await controller.DeleteUser(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteUser_NotFound_ReturnsNotFound()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                DeleteUserHandler = id => Task.FromResult(false)
            };
            var controller = new AdminUsersController(fakeService);

            // Act
            var result = await controller.DeleteUser(999);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        public async Task ResetPassword_EmptyPassword_ReturnsBadRequest()
        {
            // Arrange
            var fakeService = new FakeAuthService();
            var controller = new AdminUsersController(fakeService);
            var request = new AdminResetPasswordRequest { NewPassword = "" };

            // Act
            var result = await controller.ResetPassword(1, request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task ResetPassword_Success_ReturnsOk()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                AdminResetPasswordHandler = (id, pwd) => Task.FromResult(true)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new AdminResetPasswordRequest { NewPassword = "NewPassword123!" };

            // Act
            var result = await controller.ResetPassword(1, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task ResetPassword_NotFound_ReturnsNotFound()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                AdminResetPasswordHandler = (id, pwd) => Task.FromResult(false)
            };
            var controller = new AdminUsersController(fakeService);
            var request = new AdminResetPasswordRequest { NewPassword = "NewPassword123!" };

            // Act
            var result = await controller.ResetPassword(999, request);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }
    }
}

