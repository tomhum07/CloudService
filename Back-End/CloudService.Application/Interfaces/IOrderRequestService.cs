using System.Collections.Generic;
using System.Threading.Tasks;
using CloudService.Application.DTOs.Common;
using CloudService.Application.DTOs.Orders;

namespace CloudService.Application.Interfaces
{
    public interface IOrderRequestService
    {
        Task<PagedResult<OrderRequestDto>> GetOrderRequestsAsync(int pageNumber = 1, int pageSize = 10, int? status = null, string? search = null);
        Task<IEnumerable<OrderRequestDto>> GetAllOrdersAsync();
        Task<OrderRequestDto?> GetByIdAsync(int id);
        Task<OrderRequestDto> CreateOrderRequestAsync(CreateOrderRequestDto dto);
        Task<OrderRequestDto?> UpdateStatusAsync(int id, UpdateOrderStatusDto dto);
        Task<byte[]> ExportOrdersToCsvAsync();
        Task<byte[]> ExportOrdersToExcelAsync();
        Task<IEnumerable<OrderRequestDto>> GetCustomerOrdersAsync(string emailOrUsername);
    }
}
