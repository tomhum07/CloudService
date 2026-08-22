using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/statistics")]
    [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statisticsService;

        public StatisticsController(IStatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = await _statisticsService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetMonthlyOrderStats()
        {
            var stats = await _statisticsService.GetMonthlyOrderStatsAsync();
            return Ok(stats);
        }

        [HttpGet("popular-plans")]
        public async Task<IActionResult> GetPopularPlanStats()
        {
            var stats = await _statisticsService.GetPopularPlanStatsAsync();
            return Ok(stats);
        }
    }
}
