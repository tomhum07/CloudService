using System.Collections.Generic;

namespace CloudService.Application.DTOs.Statistics
{
    public class DashboardStatsDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int ActiveAffiliates { get; set; }
        public int TotalUsers { get; set; }
        public int TotalPlans { get; set; }
        public List<MonthlyStatDto> MonthlyOrders { get; set; } = new();
        public List<PopularPlanStatDto> PopularPlans { get; set; } = new();
    }

    public class MonthlyStatDto
    {
        public string Month { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class PopularPlanStatDto
    {
        public int PlanId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public double Percentage { get; set; }
    }
}
