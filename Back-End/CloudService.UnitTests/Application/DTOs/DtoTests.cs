using Xunit;
using CloudService.Application.DTOs.Auth;

namespace CloudService.UnitTests.Application.DTOs
{
    public class DtoTests
    {
        [Fact]
        public void LoginRequest_ShouldSetPropertiesCorrectly()
        {
            var req = new LoginRequest { Username = "admin", Password = "password" };
            Assert.Equal("admin", req.Username);
            Assert.Equal("password", req.Password);
        }

        [Fact]
        public void RegisterRequest_ShouldSetPropertiesCorrectly()
        {
            var req = new RegisterRequest
            {
                Username = "user1",
                Password = "pass123",
                FullName = "Test User",
                Email = "test@example.com",
                RoleId = 2
            };
            Assert.Equal("user1", req.Username);
            Assert.Equal("pass123", req.Password);
            Assert.Equal("Test User", req.FullName);
            Assert.Equal("test@example.com", req.Email);
            Assert.Equal(2, req.RoleId);
        }

        [Fact]
        public void AuthResponse_ShouldSetPropertiesCorrectly()
        {
            var res = new AuthResponse
            {
                AccessToken = "token123",
                Username = "user1",
                FullName = "Test User",
                Email = "test@example.com",
                Role = "User"
            };
            Assert.Equal("token123", res.AccessToken);
            Assert.Equal("user1", res.Username);
            Assert.Equal("Test User", res.FullName);
            Assert.Equal("test@example.com", res.Email);
            Assert.Equal("User", res.Role);
        }
    }
}
