using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class PlanPromotion : BaseEntity
    {
        public int PlanId { get; set; }
        public virtual ServicePlan? Plan { get; set; }
        public int PromotionId { get; set; }
        public virtual Promotion? Promotion { get; set; }
    }
}
