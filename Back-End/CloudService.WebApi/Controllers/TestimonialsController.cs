using CloudService.Application.DTOs.Testimonial;
using CloudService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestimonialsController : ControllerBase
    {
        private readonly ITestimonialService _service;

        public TestimonialsController(ITestimonialService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TestimonialDto>>> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TestimonialDto>> GetById(int id)
        {
            var testimonial = await _service.GetByIdAsync(id);

            if (testimonial == null)
                return NotFound();

            return Ok(testimonial);
        }

        [HttpPost]
        public async Task<ActionResult<TestimonialDto>> Create(
            CreateTestimonialRequest request)
        {
            var testimonial = await _service.CreateAsync(request);

            return CreatedAtAction(
                nameof(GetById),
                new { id = testimonial.Id },
                testimonial);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TestimonialDto>> Update(
            int id,
            UpdateTestimonialRequest request)
        {
            var testimonial = await _service.UpdateAsync(id, request);

            if (testimonial == null)
                return NotFound();

            return Ok(testimonial);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);

            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
