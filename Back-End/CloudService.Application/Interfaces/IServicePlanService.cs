using System.Threading.Tasks;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Services;

namespace CloudService.Application.Interfaces
{
    public interface IServicePlanService
    {
        Task<PagedResult<ServicePlanDto>> GetPagedAsync(int page, int pageSize, int? categoryId, string? search, string? sort);
        Task<ServicePlanDto?> GetByIdAsync(int id);
        Task<ServicePlanDto> CreateAsync(CreateServicePlanRequest request);
        Task<ServicePlanDto?> UpdateAsync(int id, UpdateServicePlanRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
