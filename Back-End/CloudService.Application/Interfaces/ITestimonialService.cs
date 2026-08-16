using CloudService.Application.DTOs.Testimonial;

namespace CloudService.Application.Interfaces
{
    public interface ITestimonialService
    {
        Task<IEnumerable<TestimonialDto>> GetAllAsync();

        Task<TestimonialDto?> GetByIdAsync(int id);

        Task<TestimonialDto> CreateAsync(CreateTestimonialRequest request);

        Task<TestimonialDto?> UpdateAsync(
            int id,
            UpdateTestimonialRequest request);

        Task<bool> DeleteAsync(int id);
    }
}
