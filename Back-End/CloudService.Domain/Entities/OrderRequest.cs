using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class OrderRequest : BaseEntity
    {
        public int PlanPriceId { get; set; }
        public virtual PlanPrice? PlanPrice { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public int Status { get; set; } = 0; // 0: New, 1: Processing, 2: Completed, 3: Rejected
        public string? Notes { get; set; }
    }
}
