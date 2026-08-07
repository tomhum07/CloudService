using System.Security.Claims;
using CloudService.Domain.Entities;

namespace CloudService.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateAccessToken(AppUser user);
        string GenerateRefreshToken();
    }
}
