using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Services;

namespace CloudService.Application.Interfaces
{
    public interface IPlanPriceService
    {
        Task<IEnumerable<PlanPriceDto>> GetPricesByPlanIdAsync(int planId, bool includeInactive = false);
        Task<PlanPriceDto> CreatePriceAsync(int planId, CreatePlanPriceRequest request);
        Task<PlanPriceDto?> UpdatePriceAsync(int planId, int priceId, UpdatePlanPriceRequest request);
        Task<bool> DeletePriceAsync(int planId, int priceId);
        Task<IEnumerable<PromotionDto>> GetAllPromotionsAsync();
        Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request);
    }
}
