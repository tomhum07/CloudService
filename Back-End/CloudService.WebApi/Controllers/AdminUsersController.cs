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

        public AdminUsersController(IAuthService authService)
        {
            _authService = authService;
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
            var result = await _authService.RegisterUserAsync(request);
            if (!result)
            {
                return BadRequest(new { message = "Tên đăng nhập hoặc Email đã tồn tại trong hệ thống." });
            }
            return Ok(new { message = "Tạo tài khoản quản trị mới thành công." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var success = await _authService.UpdateUserAsync(id, request);
            if (!success)
            {
                return BadRequest(new { message = "Không thể cập nhật tài khoản. Vui lòng kiểm tra lại thông tin và vai trò." });
            }
            return Ok(new { message = "Cập nhật thông tin tài khoản thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _authService.DeleteUserAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy tài khoản để xóa." });
            }
            return Ok(new { message = "Vô hiệu hóa tài khoản thành công." });
        }

        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Mật khẩu mới không được để trống." });
            }
            var success = await _authService.AdminResetPasswordAsync(id, request.NewPassword);
            if (!success)
            {
                return NotFound(new { message = "Không tìm thấy tài khoản để đặt lại mật khẩu." });
            }
            return Ok(new { message = "Đặt lại mật khẩu tài khoản thành công." });
        }
    }
}

