using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;

namespace CloudService.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtTokenGenerator _tokenGenerator;

        public AuthService(ApplicationDbContext context, IJwtTokenGenerator tokenGenerator)
        {
            _context = context;
            _tokenGenerator = tokenGenerator;
        }

        public async Task<AuthResponse?> LoginAsync(LoginRequest request, Action<string> setRefreshTokenCookie)
        {
            var user = await _context.AppUsers
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            var accessToken = _tokenGenerator.GenerateAccessToken(user);
            var refreshToken = _tokenGenerator.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            
            await _context.SaveChangesAsync();
            setRefreshTokenCookie(refreshToken);

            return new AuthResponse
            {
                AccessToken = accessToken,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? "Editor"
            };
        }

        public async Task<AuthResponse?> RefreshTokenAsync(string refreshToken, Action<string> setRefreshTokenCookie)
        {
            var user = await _context.AppUsers
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return null;
            }

            var newAccessToken = _tokenGenerator.GenerateAccessToken(user);
            var newRefreshToken = _tokenGenerator.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();
            setRefreshTokenCookie(newRefreshToken);

            return new AuthResponse
            {
                AccessToken = newAccessToken,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role?.Name ?? "Editor"
            };
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
            if (user == null) return false;

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RegisterUserAsync(RegisterRequest request)
        {
            var exist = await _context.AppUsers.AnyAsync(u => u.Username == request.Username || u.Email == request.Email);
            if (exist) return false;

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newUser = new AppUser
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Email = request.Email,
                RoleId = request.RoleId
            };

            await _context.AppUsers.AddAsync(newUser);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            return await _context.AppUsers
                .Include(u => u.Role)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role != null ? u.Role.Name : string.Empty,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return false;

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == request.Role.ToLower());
            if (role == null) return false;

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.RoleId = role.Id;
            user.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return false;

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request)
        {
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) return false;

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return false;
            }

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AdminResetPasswordAsync(int id, string newPassword)
        {
            var user = await _context.AppUsers.FindAsync(id);
            if (user == null) return false;

            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
