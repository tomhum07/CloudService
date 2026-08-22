using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Hubs;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/service-categories")]
    public class ServiceCategoriesController : ControllerBase
    {
        private readonly IServiceCategoryService _serviceCategoryService;
        private readonly IAuditLogService _auditLogService;
        private readonly IHubContext<DataSyncHub> _hubContext;

        public ServiceCategoriesController(
            IServiceCategoryService serviceCategoryService,
            IAuditLogService auditLogService,
            IHubContext<DataSyncHub> hubContext)
        {
            _serviceCategoryService = serviceCategoryService;
            _auditLogService = auditLogService;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        {
            var categories = await _serviceCategoryService.GetAllAsync(includeInactive);
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _serviceCategoryService.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateServiceCategoryRequest request)
        {
            var actor = User?.Identity?.Name ?? "Admin";
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _serviceCategoryService.CreateAsync(request);
            await _auditLogService.LogAsync(actor, "Tạo danh mục dịch vụ", $"Tạo mới danh mục: {category.Name} (slug: {category.Slug})");
            await _hubContext.Clients.All.SendAsync("DataChanged", "category", "create");
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceCategoryRequest request)
        {
            var actor = User?.Identity?.Name ?? "Admin";
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _serviceCategoryService.UpdateAsync(id, request);
            if (category == null)
            {
                return NotFound();
            }

            await _auditLogService.LogAsync(actor, "Cập nhật danh mục dịch vụ", $"Cập nhật danh mục #{id}: {category.Name} (Kích hoạt: {category.IsActive})");
            await _hubContext.Clients.All.SendAsync("DataChanged", "category", "update");
            return Ok(category);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var actor = User?.Identity?.Name ?? "Admin";
            var result = await _serviceCategoryService.DeleteAsync(id);
            if (!result)
            {
                return NotFound();
            }

            await _auditLogService.LogAsync(actor, "Xóa danh mục dịch vụ", $"Đã xóa danh mục dịch vụ #{id}");
            await _hubContext.Clients.All.SendAsync("DataChanged", "category", "delete");
            return NoContent();
        }
    }
}
