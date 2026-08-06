using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class PlanPrice : BaseEntity
    {
        public int PlanId { get; set; }
        public virtual ServicePlan? Plan { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? PromotionId { get; set; }
        public virtual Promotion? Promotion { get; set; }
        public virtual ICollection<OrderRequest> Orders { get; set; } = new List<OrderRequest>();
    }
}
