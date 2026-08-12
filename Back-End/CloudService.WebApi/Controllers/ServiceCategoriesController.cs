using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Application.DTOs.Services;
using CloudService.Application.Interfaces;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceCategoriesController : ControllerBase
    {
        private readonly IServiceCategoryService _serviceCategoryService;

        public ServiceCategoriesController(IServiceCategoryService serviceCategoryService)
        {
            _serviceCategoryService = serviceCategoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _serviceCategoryService.GetAllAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _serviceCategoryService.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateServiceCategoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _serviceCategoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceCategoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _serviceCategoryService.UpdateAsync(id, request);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _serviceCategoryService.DeleteAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
