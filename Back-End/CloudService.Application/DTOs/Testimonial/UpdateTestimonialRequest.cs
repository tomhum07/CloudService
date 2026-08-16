namespace CloudService.Application.DTOs.Testimonial
{
    public class UpdateTestimonialRequest
    {
        public string CustomerName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
    }
}
