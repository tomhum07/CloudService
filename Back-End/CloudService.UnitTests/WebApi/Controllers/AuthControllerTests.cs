using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Controllers;

namespace CloudService.UnitTests.WebApi.Controllers
{
    public class AuthControllerTests
    {
        private class FakeAuthService : IAuthService
        {
            public Func<LoginRequest, Action<string>, Task<AuthResponse?>>? LoginHandler { get; set; }
            public Func<string, Action<string>, Task<AuthResponse?>>? RefreshTokenHandler { get; set; }
            public Func<string, Task<bool>>? LogoutHandler { get; set; }
            public Func<RegisterRequest, Task<bool>>? RegisterUserHandler { get; set; }

            public Task<AuthResponse?> LoginAsync(LoginRequest request, Action<string> setRefreshTokenCookie)
            {
                if (LoginHandler != null) return LoginHandler(request, setRefreshTokenCookie);
                return Task.FromResult<AuthResponse?>(null);
            }

            public Task<AuthResponse?> RefreshTokenAsync(string refreshToken, Action<string> setRefreshTokenCookie)
            {
                if (RefreshTokenHandler != null) return RefreshTokenHandler(refreshToken, setRefreshTokenCookie);
                return Task.FromResult<AuthResponse?>(null);
            }

            public Task<bool> LogoutAsync(string refreshToken)
            {
                if (LogoutHandler != null) return LogoutHandler(refreshToken);
                return Task.FromResult(true);
            }

            public Task<bool> RegisterUserAsync(RegisterRequest request)
            {
                if (RegisterUserHandler != null) return RegisterUserHandler(request);
                return Task.FromResult(true);
            }
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkAndSetsCookie()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                LoginHandler = (req, setCookie) =>
                {
                    setCookie("test-refresh-token");
                    return Task.FromResult<AuthResponse?>(new AuthResponse
                    {
                        AccessToken = "test-access-token",
                        Username = req.Username,
                        FullName = "Test User",
                        Email = "test@example.com",
                        Role = "Admin"
                    });
                }
            };

            var controller = new AuthController(fakeService);
            var httpContext = new DefaultHttpContext();
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            var loginRequest = new LoginRequest { Username = "testuser", Password = "TestValKey1!" };

            // Act
            var result = await controller.Login(loginRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<AuthResponse>(okResult.Value);
            Assert.Equal("test-access-token", response.AccessToken);
            Assert.Equal("testuser", response.Username);

            var setCookieHeader = httpContext.Response.Headers["Set-Cookie"].ToString();
            Assert.Contains("refreshToken=test-refresh-token", setCookieHeader);
            Assert.Contains("httponly", setCookieHeader, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("samesite=strict", setCookieHeader, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                LoginHandler = (req, setCookie) => Task.FromResult<AuthResponse?>(null)
            };

            var controller = new AuthController(fakeService);
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

            // Act
            var result = await controller.Login(new LoginRequest { Username = "wrong", Password = "WrongValKey1!" });

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.NotNull(unauthorizedResult.Value);
        }

        [Fact]
        public async Task RefreshToken_MissingCookie_ReturnsBadRequest()
        {
            // Arrange
            var fakeService = new FakeAuthService();
            var controller = new AuthController(fakeService);
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

            // Act
            var result = await controller.RefreshToken();

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        public async Task RefreshToken_ValidCookie_ReturnsOkAndSetsCookie()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                RefreshTokenHandler = (token, setCookie) =>
                {
                    setCookie("new-refresh-token");
                    return Task.FromResult<AuthResponse?>(new AuthResponse
                    {
                        AccessToken = "new-access-token",
                        Username = "refresheduser"
                    });
                }
            };

            var controller = new AuthController(fakeService);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["Cookie"] = "refreshToken=valid-refresh-token";
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await controller.RefreshToken();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<AuthResponse>(okResult.Value);
            Assert.Equal("new-access-token", response.AccessToken);

            var setCookieHeader = httpContext.Response.Headers["Set-Cookie"].ToString();
            Assert.Contains("refreshToken=new-refresh-token", setCookieHeader);
        }

        [Fact]
        public async Task RefreshToken_InvalidToken_ReturnsUnauthorized()
        {
            // Arrange
            var fakeService = new FakeAuthService
            {
                RefreshTokenHandler = (token, setCookie) => Task.FromResult<AuthResponse?>(null)
            };

            var controller = new AuthController(fakeService);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["Cookie"] = "refreshToken=invalid-token";
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await controller.RefreshToken();

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.NotNull(unauthorizedResult.Value);
        }

        [Fact]
        public async Task Logout_NoCookie_ReturnsOkWithoutCallingService()
        {
            // Arrange
            var serviceCalled = false;
            var fakeService = new FakeAuthService
            {
                LogoutHandler = (token) =>
                {
                    serviceCalled = true;
                    return Task.FromResult(true);
                }
            };

            var controller = new AuthController(fakeService);
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

            // Act
            var result = await controller.Logout();

            // Assert
            Assert.IsType<OkResult>(result);
            Assert.False(serviceCalled);
        }

        [Fact]
        public async Task Logout_WithCookie_CallsServiceAndDeletesCookie()
        {
            // Arrange
            var logoutTokenPassed = "";
            var fakeService = new FakeAuthService
            {
                LogoutHandler = (token) =>
                {
                    logoutTokenPassed = token;
                    return Task.FromResult(true);
                }
            };

            var controller = new AuthController(fakeService);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["Cookie"] = "refreshToken=active-refresh-token";
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await controller.Logout();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal("active-refresh-token", logoutTokenPassed);

            var setCookieHeader = httpContext.Response.Headers["Set-Cookie"].ToString();
            Assert.Contains("refreshToken=", setCookieHeader);
        }
    }
}
