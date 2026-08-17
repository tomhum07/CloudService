using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Statistics;

namespace CloudService.Application.Interfaces
{
    public interface IStatisticsService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<List<MonthlyStatDto>> GetMonthlyOrderStatsAsync();
        Task<List<PopularPlanStatDto>> GetPopularPlanStatsAsync();
    }
}
