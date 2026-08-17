using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request, token => SetRefreshTokenCookie(token));
                if (response == null)
                {
                    return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
                }
                return Ok(response);
            }
            catch (Exception ex) when (ex.Message == "LockedAccount")
            {
                return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa." });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return BadRequest(new { message = "Thiếu Refresh Token." });
            }

            var response = await _authService.RefreshTokenAsync(refreshToken, token => SetRefreshTokenCookie(token));
            if (response == null)
            {
                return Unauthorized(new { message = "Refresh Token không hợp lệ hoặc đã hết hạn." });
            }
            return Ok(response);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Ok(); // Nếu không có cookie thì đã logout sẵn
            }

            await _authService.LogoutAsync(refreshToken);
            
            // Xóa Cookie Refresh Token ở client
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });

            return Ok(new { message = "Đã đăng xuất thành công." });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var username = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var result = await _authService.ChangePasswordAsync(username, request);
            if (!result)
            {
                return BadRequest(new { message = "Mật khẩu cũ không chính xác hoặc tài khoản không tồn tại." });
            }

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var username = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var profile = await _authService.GetProfileAsync(username);
            if (profile == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin tài khoản." });
            }

            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var username = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var result = await _authService.UpdateProfileAsync(username, request);
            if (!result)
            {
                return BadRequest(new { message = "Không thể cập nhật thông tin." });
            }

            return Ok(new { message = "Cập nhật thông tin thành công." });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterUserAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Tên đăng nhập hoặc Email đã tồn tại trong hệ thống." });
            }
            return Ok(new { message = "Đăng ký tài khoản thành công." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
            {
                return BadRequest(new { message = "Vui lòng nhập Email hoặc Tên đăng nhập." });
            }

            var sent = await _authService.SendForgotPasswordOtpAsync(request);
            if (!sent)
            {
                return BadRequest(new { message = "Không tìm thấy tài khoản hoặc email không hợp lệ." });
            }

            return Ok(new { message = "Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư." });
        }

        [HttpPost("reset-password-otp")]
        public async Task<IActionResult> ResetPasswordWithOtp([FromBody] VerifyResetOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.EmailOrUsername) || string.IsNullOrWhiteSpace(request.OtpCode) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin xác thực." });
            }

            var (success, message) = await _authService.ResetPasswordWithOtpAsync(request);
            if (!success)
            {
                return BadRequest(new { message });
            }

            return Ok(new { message });
        }

        private void SetRefreshTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("refreshToken", token, cookieOptions);
        }
    }
}

