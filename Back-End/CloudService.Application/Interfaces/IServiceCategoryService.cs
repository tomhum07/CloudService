using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Services;

namespace CloudService.Application.Interfaces
{
    public interface IServiceCategoryService
    {
        Task<IEnumerable<ServiceCategoryDto>> GetAllAsync();
        Task<ServiceCategoryDto?> GetByIdAsync(int id);
        Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryRequest request);
        Task<ServiceCategoryDto?> UpdateAsync(int id, UpdateServiceCategoryRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
