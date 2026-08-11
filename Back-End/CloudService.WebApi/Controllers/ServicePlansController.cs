using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [Route("api/service-plans")]
    [ApiController]
    public class ServicePlansController : ControllerBase
    {
        private readonly IServicePlanService _servicePlanService;

        public ServicePlansController(IServicePlanService servicePlanService)
        {
            _servicePlanService = servicePlanService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<ServicePlanDto>>> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sort = null)
        {
            var result = await _servicePlanService.GetPagedAsync(page, pageSize, categoryId, search, sort);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ServicePlanDto>> GetById(int id)
        {
            var plan = await _servicePlanService.GetByIdAsync(id);
            if (plan == null) return NotFound();
            return Ok(plan);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServicePlanDto>> Create([FromBody] CreateServicePlanRequest request)
        {
            var plan = await _servicePlanService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServicePlanDto>> Update(int id, [FromBody] UpdateServicePlanRequest request)
        {
            var plan = await _servicePlanService.UpdateAsync(id, request);
            if (plan == null) return NotFound();
            return Ok(plan);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _servicePlanService.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
