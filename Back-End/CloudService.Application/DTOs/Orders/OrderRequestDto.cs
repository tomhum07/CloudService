using System;

namespace CloudService.Application.DTOs.Orders
{
    public class OrderRequestDto
    {
        public int Id { get; set; }
        public int PlanPriceId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public int Status { get; set; } // 0: New, 1: Processing, 2: Completed, 3: Rejected
        public string StatusName => Status switch
        {
            0 => "Chờ duyệt",
            1 => "Đang xử lý",
            2 => "Hoàn tất",
            3 => "Đã hủy",
            _ => "Không xác định"
        };
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string OrderCode => $"ORD-{Id:D5}";
    }

    public class CreateOrderRequestDto
    {
        public int? PlanPriceId { get; set; }
        public int? PlanId { get; set; }
        public string? PlanName { get; set; }
        public string? BillingCycle { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public int Status { get; set; }
        public string? Notes { get; set; }
    }
}
