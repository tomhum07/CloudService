using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CloudService.Application.DTOs.Orders;
using CloudService.Application.Interfaces;
using CloudService.WebApi.Hubs;

namespace CloudService.WebApi.Controllers
{
    [ApiController]
    [Route("api/order-requests")]
    public class OrderRequestsController : ControllerBase
    {
        private readonly IOrderRequestService _orderService;
        private readonly IAuditLogService _auditLogService;
        private readonly IEmailService _emailService;
        private readonly IHubContext<DataSyncHub> _hubContext;

        public OrderRequestsController(
            IOrderRequestService orderService, 
            IAuditLogService auditLogService, 
            IEmailService emailService,
            IHubContext<DataSyncHub> hubContext)
        {
            _orderService = orderService;
            _auditLogService = auditLogService;
            _emailService = emailService;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] int? status = null, [FromQuery] string? search = null)
        {
            var result = await _orderService.GetOrderRequestsAsync(page, pageSize, status, search);
            return Ok(result);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllOrders()
        {
            var result = await _orderService.GetAllOrdersAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn đặt hàng." });
            return Ok(order);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName) || string.IsNullOrWhiteSpace(dto.CustomerEmail) || string.IsNullOrWhiteSpace(dto.CustomerPhone))
            {
                return BadRequest(new { message = "Vui lòng cung cấp đầy đủ họ tên, email và số điện thoại." });
            }

            var created = await _orderService.CreateOrderRequestAsync(dto);

            // Ghi audit log
            await _auditLogService.LogAsync(
                username: dto.CustomerEmail,
                action: $"Nhận yêu cầu đặt hàng mới {created.OrderCode} từ KH {dto.CustomerName}",
                payload: $"{created.PlanName} ({created.BillingCycle}) - {created.Price:N0}đ"
            );

            await _hubContext.Clients.All.SendAsync("DataChanged", "order", "create");

            return CreatedAtAction(nameof(GetOrderById), new { id = created.Id }, created);
        }

        [HttpPatch("{id}/status")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var updated = await _orderService.UpdateStatusAsync(id, dto);
            if (updated == null) return NotFound(new { message = "Không tìm thấy đơn đặt hàng." });

            var user = User.Identity?.Name ?? "System";
            await _auditLogService.LogAsync(
                username: user,
                action: $"Cập nhật trạng thái đơn {updated.OrderCode} sang '{updated.StatusName}'",
                payload: $"Status={dto.Status}"
            );

            // Tự động gửi email xác nhận nếu trạng thái chuyển sang 2 (Hoàn tất / Đã thanh toán)
            if (dto.Status == 2 && !string.IsNullOrWhiteSpace(updated.CustomerEmail))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailService.SendOrderSuccessNotificationAsync(
                            toEmail: updated.CustomerEmail,
                            customerName: updated.CustomerName,
                            orderCode: updated.OrderCode,
                            planName: updated.PlanName,
                            price: updated.Price
                        );
                    }
                    catch { }
                });
            }

            await _hubContext.Clients.All.SendAsync("DataChanged", "order", "update");

            return Ok(updated);
        }

        [HttpGet("export")]
        [HttpGet("export-excel")]
        public async Task<IActionResult> ExportOrdersExcel()
        {
            var bytes = await _orderService.ExportOrdersToExcelAsync();
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"orders_export_{System.DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx");
        }

        [HttpGet("export-csv")]
        public async Task<IActionResult> ExportOrdersCsv()
        {
            var bytes = await _orderService.ExportOrdersToCsvAsync();
            return File(bytes, "text/csv; charset=utf-8", $"orders_export_{System.DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? email)
        {
            var user = User.Identity?.Name ?? email;
            if (string.IsNullOrWhiteSpace(user))
            {
                return BadRequest(new { message = "Vui lòng cung cấp email hoặc đăng nhập để tra cứu." });
            }

            var orders = await _orderService.GetCustomerOrdersAsync(user);
            return Ok(orders);
        }
    }
}
