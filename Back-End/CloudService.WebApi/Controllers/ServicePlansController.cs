using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Hubs;

namespace CloudService.WebApi.Controllers
{
    [Route("api/service-plans")]
    [ApiController]
    public class ServicePlansController : ControllerBase
    {
        private readonly IServicePlanService _servicePlanService;
        private readonly IPlanPriceService _planPriceService;
        private readonly IHubContext<DataSyncHub> _hubContext;

        public ServicePlansController(
            IServicePlanService servicePlanService, 
            IPlanPriceService planPriceService,
            IHubContext<DataSyncHub> hubContext)
        {
            _servicePlanService = servicePlanService;
            _planPriceService = planPriceService;
            _hubContext = hubContext;
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
            await _hubContext.Clients.All.SendAsync("DataChanged", "plan", "create");
            return CreatedAtAction(nameof(GetById), new { id = plan.Id }, plan);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServicePlanDto>> Update(int id, [FromBody] UpdateServicePlanRequest request)
        {
            var plan = await _servicePlanService.UpdateAsync(id, request);
            if (plan == null) return NotFound();
            await _hubContext.Clients.All.SendAsync("DataChanged", "plan", "update");
            return Ok(plan);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _servicePlanService.DeleteAsync(id);
            if (!result) return NotFound();
            await _hubContext.Clients.All.SendAsync("DataChanged", "plan", "delete");
            return NoContent();
        }

        [HttpPost("{id}/qr-code/regenerate")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ServicePlanDto>> RegenerateQrCode(int id)
        {
            var plan = await _servicePlanService.RegenerateQrCodeAsync(id);
            if (plan == null) return NotFound();
            await _hubContext.Clients.All.SendAsync("DataChanged", "plan", "update");
            return Ok(plan);
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
            await _hubContext.Clients.All.SendAsync("DataChanged", "price", "create");
            return CreatedAtAction(nameof(GetPrices), new { id = id }, price);
        }

        [HttpPut("{id}/prices/{priceId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PlanPriceDto>> UpdatePrice(int id, int priceId, [FromBody] UpdatePlanPriceRequest request)
        {
            var price = await _planPriceService.UpdatePriceAsync(id, priceId, request);
            if (price == null) return NotFound();
            await _hubContext.Clients.All.SendAsync("DataChanged", "price", "update");
            return Ok(price);
        }

        [HttpDelete("{id}/prices/{priceId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePrice(int id, int priceId)
        {
            var result = await _planPriceService.DeletePriceAsync(id, priceId);
            if (!result) return NotFound();
            await _hubContext.Clients.All.SendAsync("DataChanged", "price", "delete");
            return NoContent();
        }
    }
}
