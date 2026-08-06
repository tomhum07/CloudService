using System;
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class Promotion : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int DiscountPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public virtual ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    }
}
