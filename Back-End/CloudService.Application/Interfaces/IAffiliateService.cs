using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Affiliates;
using CloudService.Application.DTOs.Common;

namespace CloudService.Application.Interfaces
{
    public interface IAffiliateService
    {
        Task<PagedResult<AffiliateApplicationDto>> GetApplicationsAsync(int pageNumber = 1, int pageSize = 10, int? status = null);
        Task<IEnumerable<AffiliateApplicationDto>> GetAllApplicationsAsync();
        Task<AffiliateApplicationDto?> GetByIdAsync(int id);
        Task<AffiliateApplicationDto> CreateApplicationAsync(CreateAffiliateApplicationDto dto);
        Task<AffiliateApplicationDto?> UpdateStatusAsync(int id, UpdateAffiliateStatusDto dto);
    }
}
