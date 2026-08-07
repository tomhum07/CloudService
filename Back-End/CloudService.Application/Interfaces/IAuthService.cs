using System;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Auth;

namespace CloudService.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse?> LoginAsync(LoginRequest request, Action<string> setRefreshTokenCookie);
        Task<AuthResponse?> RefreshTokenAsync(string refreshToken, Action<string> setRefreshTokenCookie);
        Task<bool> LogoutAsync(string refreshToken);
        Task<bool> RegisterUserAsync(RegisterRequest request);
    }
}
