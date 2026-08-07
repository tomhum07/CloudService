using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Services
{
    public class JwtTokenGeneratorTests
    {
        private class TestConfiguration : IConfiguration
        {
            private readonly Dictionary<string, string?> _data;
            public TestConfiguration(Dictionary<string, string?> data) => _data = data;
            public string? this[string key] { get => _data.GetValueOrDefault(key); set => _data[key] = value; }
            public IEnumerable<IConfigurationSection> GetChildren() => System.Linq.Enumerable.Empty<IConfigurationSection>();
            public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken() => throw new NotImplementedException();
            public IConfigurationSection GetSection(string key) => throw new NotImplementedException();
        }

        private IConfiguration GetMockConfiguration()
        {
            return new TestConfiguration(new Dictionary<string, string?>
            {
                { "Jwt:Key", "ASuperSecretKeyThatIsAtLeast32CharactersLongForJWTValidation" },
                { "Jwt:Issuer", "CloudServiceAPI" },
                { "Jwt:Audience", "CloudServiceFE" },
                { "Jwt:DurationInMinutes", "15" }
            });
        }

        [Fact]
        public void GenerateAccessToken_ShouldReturnValidJwtToken_WithClaims()
        {
            var config = GetMockConfiguration();
            var generator = new JwtTokenGenerator(config);
            var user = new AppUser
            {
                Id = 10,
                Username = "testuser",
                Email = "test@example.com",
                Role = new Role { Id = 1, Name = "Admin" }
            };

            var tokenString = generator.GenerateAccessToken(user);

            Assert.False(string.IsNullOrWhiteSpace(tokenString));

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(tokenString);

            Assert.Equal("CloudServiceAPI", jwtToken.Issuer);
            Assert.Contains("CloudServiceFE", jwtToken.Audiences);
            
            var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name || c.Type == "unique_name")?.Value;
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email")?.Value;
            var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")?.Value;
            var nameIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid")?.Value;

            Assert.Equal("testuser", nameClaim);
            Assert.Equal("test@example.com", emailClaim);
            Assert.Equal("Admin", roleClaim);
            Assert.Equal("10", nameIdClaim);
        }

        [Fact]
        public void GenerateRefreshToken_ShouldReturnBase64String_Of64Bytes()
        {
            var config = GetMockConfiguration();
            var generator = new JwtTokenGenerator(config);

            var refreshToken = generator.GenerateRefreshToken();

            Assert.False(string.IsNullOrWhiteSpace(refreshToken));
            var bytes = Convert.FromBase64String(refreshToken);
            Assert.Equal(64, bytes.Length);
        }
    }
}
