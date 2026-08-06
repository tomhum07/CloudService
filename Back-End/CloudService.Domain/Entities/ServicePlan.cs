using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class ServicePlan : BaseEntity
    {
        public int CategoryId { get; set; }
        public virtual ServiceCategory? Category { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? Storage { get; set; }
        public string? Bandwidth { get; set; }
        public string? QrCodeUrl { get; set; }
        public virtual ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    }
}
