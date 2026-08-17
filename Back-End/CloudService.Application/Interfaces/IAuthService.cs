using System;
using System.Collections.Generic;
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
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<bool> UpdateUserAsync(int id, UpdateUserRequest request);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request);
        Task<bool> AdminResetPasswordAsync(int id, string newPassword);
        Task<UserDto?> GetProfileAsync(string username);
        Task<bool> UpdateProfileAsync(string username, UpdateProfileRequest request);
    }
}
