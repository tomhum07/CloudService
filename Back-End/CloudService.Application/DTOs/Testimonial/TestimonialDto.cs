namespace CloudService.Application.DTOs.Testimonial
{
    public class TestimonialDto
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
    }
}
