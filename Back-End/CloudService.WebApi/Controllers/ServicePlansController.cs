using System.Collections.Generic;
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
        private readonly IPlanPriceService _planPriceService;

        public ServicePlansController(IServicePlanService servicePlanService, IPlanPriceService planPriceService)
        {
            _servicePlanService = servicePlanService;
            _planPriceService = planPriceService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<ServicePlanDto>>> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sort = null,
            [FromQuery] bool includeInactive = false)
        {
            var result = await _servicePlanService.GetPagedAsync(page, pageSize, categoryId, search, sort, includeInactive);
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

        [HttpGet("{id}/prices")]
        public async Task<ActionResult<IEnumerable<PlanPriceDto>>> GetPrices(int id, [FromQuery] bool includeInactive = false)
        {
            var prices = await _planPriceService.GetPricesByPlanIdAsync(id, includeInactive);
            return Ok(prices);
        }

        [HttpPost("{id}/prices")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PlanPriceDto>> CreatePrice(int id, [FromBody] CreatePlanPriceRequest request)
        {
            var price = await _planPriceService.CreatePriceAsync(id, request);
            return CreatedAtAction(nameof(GetPrices), new { id = id }, price);
        }

        [HttpPut("{id}/prices/{priceId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PlanPriceDto>> UpdatePrice(int id, int priceId, [FromBody] UpdatePlanPriceRequest request)
        {
            var price = await _planPriceService.UpdatePriceAsync(id, priceId, request);
            if (price == null) return NotFound();
            return Ok(price);
        }

        [HttpDelete("{id}/prices/{priceId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePrice(int id, int priceId)
        {
            var result = await _planPriceService.DeletePriceAsync(id, priceId);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
