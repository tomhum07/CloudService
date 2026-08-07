using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    }
}
