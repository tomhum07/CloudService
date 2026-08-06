using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class ServiceCategory : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public virtual ICollection<ServicePlan> Plans { get; set; } = new List<ServicePlan>();
    }
}
