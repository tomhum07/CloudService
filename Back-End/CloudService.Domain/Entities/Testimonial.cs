using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class Testimonial : BaseEntity
    {
        public string CustomerName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
    }
}
