namespace CloudService.Application.DTOs.Services
{
    public class PlanPriceDto
    {
        public int Id { get; set; }
        public int PlanId { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? PromotionId { get; set; }
        public string? PromotionName { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreatePlanPriceRequest
    {
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? PromotionId { get; set; }
    }

    public class UpdatePlanPriceRequest
    {
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? PromotionId { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
