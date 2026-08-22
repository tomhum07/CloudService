using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Auth;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")] // Chỉ tài khoản có Role = Admin mới truy cập được
    public class AdminUsersController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAuditLogService _auditLogService;

        public AdminUsersController(IAuthService authService, IAuditLogService auditLogService)
        {
            _authService = authService;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] RegisterRequest request)
        {
            var currentAdmin = User?.Identity?.Name ?? "Admin";
            var result = await _authService.RegisterUserAsync(request);
            if (!result)
            {
                await _auditLogService.LogAsync(currentAdmin, "Tạo tài khoản thất bại", $"Không thể tạo tài khoản {request.Username} do trùng lặp dữ liệu");
                return BadRequest(new { message = "Tên đăng nhập hoặc Email đã tồn tại trong hệ thống." });
            }

            await _auditLogService.LogAsync(currentAdmin, "Tạo tài khoản người dùng", $"Admin {currentAdmin} đã tạo tài khoản mới: {request.Username} ({request.Email})");
            return Ok(new { message = "Tạo tài khoản quản trị mới thành công." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var currentAdmin = User?.Identity?.Name ?? "Admin";
            var success = await _authService.UpdateUserAsync(id, request);
            if (!success)
            {
                return BadRequest(new { message = "Không thể cập nhật tài khoản. Vui lòng kiểm tra lại thông tin và vai trò." });
            }

            await _auditLogService.LogAsync(currentAdmin, "Cập nhật tài khoản người dùng", $"Admin {currentAdmin} đã cập nhật người dùng #{id}: Họ tên: {request.FullName}, Vai trò: {request.Role}, Kích hoạt: {request.IsActive}");
            return Ok(new { message = "Cập nhật thông tin tài khoản thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var currentAdmin = User?.Identity?.Name ?? "Admin";
            var success = await _authService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy tài khoản để xóa." });
            }

            await _auditLogService.LogAsync(currentAdmin, "Khóa tài khoản người dùng", $"Admin {currentAdmin} đã vô hiệu hóa/xóa mềm tài khoản #{id}");
            return Ok(new { message = "Vô hiệu hóa tài khoản thành công." });
        }

        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest request)
        {
            var currentAdmin = User?.Identity?.Name ?? "Admin";
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Mật khẩu mới không được để trống." });
            }
            var success = await _authService.AdminResetPasswordAsync(id, request.NewPassword);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy tài khoản để đặt lại mật khẩu." });
            }

            await _auditLogService.LogAsync(currentAdmin, "Đặt lại mật khẩu tài khoản", $"Admin {currentAdmin} đã cấp lại mật khẩu mới cho tài khoản #{id}");
            return Ok(new { message = "Đặt lại mật khẩu tài khoản thành công." });
        }
    }
}

