using CloudService.Application.DTOs.Testimonial;
using CloudService.Application.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Services
{
    public class TestimonialService : ITestimonialService
    {
        private readonly ApplicationDbContext _context;

        public TestimonialService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TestimonialDto>> GetAllAsync()
        {
            return await _context.Testimonials
                .AsNoTracking()
                .Select(x => new TestimonialDto
                {
                    Id = x.Id,
                    CustomerName = x.CustomerName,
                    Content = x.Content,
                    Rating = x.Rating
                })
                .ToListAsync();
        }

        public async Task<TestimonialDto?> GetByIdAsync(int id)
        {
            return await _context.Testimonials
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new TestimonialDto
                {
                    Id = x.Id,
                    CustomerName = x.CustomerName,
                    Content = x.Content,
                    Rating = x.Rating
                })
                .FirstOrDefaultAsync();
        }

        public async Task<TestimonialDto> CreateAsync(
            CreateTestimonialRequest request)
        {
            var testimonial = new Testimonial
            {
                CustomerName = request.CustomerName,
                Content = request.Content,
                Rating = request.Rating
            };

            _context.Testimonials.Add(testimonial);
            await _context.SaveChangesAsync();

            return new TestimonialDto
            {
                Id = testimonial.Id,
                CustomerName = testimonial.CustomerName,
                Content = testimonial.Content,
                Rating = testimonial.Rating
            };
        }

        public async Task<TestimonialDto?> UpdateAsync(
            int id,
            UpdateTestimonialRequest request)
        {
            var testimonial = await _context.Testimonials
                .FirstOrDefaultAsync(x => x.Id == id);

            if (testimonial == null)
                return null;

            testimonial.CustomerName = request.CustomerName;
            testimonial.Content = request.Content;
            testimonial.Rating = request.Rating;

            await _context.SaveChangesAsync();

            return new TestimonialDto
            {
                Id = testimonial.Id,
                CustomerName = testimonial.CustomerName,
                Content = testimonial.Content,
                Rating = testimonial.Rating
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var testimonial = await _context.Testimonials
                .FirstOrDefaultAsync(x => x.Id == id);

            if (testimonial == null)
                return false;

            testimonial.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
