using System;

namespace CloudService.Application.DTOs.Services
{
    public class ServicePlanDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? Storage { get; set; }
        public string? Bandwidth { get; set; }
        public string? QrCodeUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateServicePlanRequest
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? Storage { get; set; }
        public string? Bandwidth { get; set; }
    }

    public class UpdateServicePlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? Storage { get; set; }
        public string? Bandwidth { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
