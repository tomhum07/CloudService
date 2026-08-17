using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Application.DTOs.Orders;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using CloudService.Infrastructure.Services;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Services
{
    public class OrderRequestServiceTests
    {
        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task CreateOrderRequestAsync_ShouldCreateOrderSuccessfully()
        {
            using var context = CreateInMemoryDbContext();
            var category = new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps", Description = "Desc" };
            context.ServiceCategories.Add(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan { Name = "VPS Pro", CategoryId = category.Id, Description = "Desc", Cpu = "2 vCPU", Ram = "4GB", Storage = "50GB SSD", Bandwidth = "1TB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 150000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var service = new OrderRequestService(context);

            var dto = new CreateOrderRequestDto
            {
                PlanPriceId = price.Id,
                CustomerName = "Nguyễn Văn Test",
                CustomerEmail = "test@example.com",
                CustomerPhone = "0912345678",
                CompanyName = "Test Corp",
                Notes = "Ghi chú đơn hàng"
            };

            var result = await service.CreateOrderRequestAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("Nguyễn Văn Test", result.CustomerName);
            Assert.Equal("test@example.com", result.CustomerEmail);
            Assert.Equal("VPS Pro", result.PlanName);
            Assert.Equal(0, result.Status); // New
            Assert.Equal("Chờ duyệt", result.StatusName);
        }

        [Fact]
        public async Task UpdateStatusAsync_ShouldUpdateStatusSuccessfully()
        {
            using var context = CreateInMemoryDbContext();
            var category = new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps" };
            context.ServiceCategories.Add(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan { Name = "VPS Basic", CategoryId = category.Id, Cpu = "1 vCPU", Ram = "2GB", Storage = "20GB", Bandwidth = "500GB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 100000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var order = new OrderRequest
            {
                PlanPriceId = price.Id,
                CustomerName = "Trần Văn A",
                CustomerEmail = "a@gmail.com",
                CustomerPhone = "0987654321",
                Status = 0
            };
            context.OrderRequests.Add(order);
            await context.SaveChangesAsync();

            var service = new OrderRequestService(context);
            var result = await service.UpdateStatusAsync(order.Id, new UpdateOrderStatusDto { Status = 2, Notes = "Đã kích hoạt server" });

            Assert.NotNull(result);
            Assert.Equal(2, result.Status);
            Assert.Equal("Hoàn tất", result.StatusName);
        }

        [Fact]
        public async Task ExportOrdersToCsvAsync_ShouldReturnValidCsvBytes()
        {
            using var context = CreateInMemoryDbContext();
            var category = new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps" };
            context.ServiceCategories.Add(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan { Name = "VPS Basic", CategoryId = category.Id, Cpu = "1 vCPU", Ram = "2GB", Storage = "20GB", Bandwidth = "500GB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 100000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var order = new OrderRequest
            {
                PlanPriceId = price.Id,
                CustomerName = "Lê Văn Csv",
                CustomerEmail = "csv@gmail.com",
                CustomerPhone = "0909090909",
                Status = 2
            };
            context.OrderRequests.Add(order);
            await context.SaveChangesAsync();

            var service = new OrderRequestService(context);
            var bytes = await service.ExportOrdersToCsvAsync();

            Assert.NotNull(bytes);
            Assert.True(bytes.Length > 0);
        }

        [Fact]
        public async Task ExportOrdersToExcelAsync_ShouldReturnValidExcelBytes()
        {
            using var context = CreateInMemoryDbContext();
            var category = new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps" };
            context.ServiceCategories.Add(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan { Name = "VPS Basic", CategoryId = category.Id, Cpu = "1 vCPU", Ram = "2GB", Storage = "20GB", Bandwidth = "500GB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 100000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var order = new OrderRequest
            {
                PlanPriceId = price.Id,
                CustomerName = "Lê Văn Excel",
                CustomerEmail = "excel@gmail.com",
                CustomerPhone = "0909090909",
                Status = 2
            };
            context.OrderRequests.Add(order);
            await context.SaveChangesAsync();

            var service = new OrderRequestService(context);
            var bytes = await service.ExportOrdersToExcelAsync();

            Assert.NotNull(bytes);
            Assert.True(bytes.Length > 0);
        }

        [Fact]
        public async Task GetCustomerOrdersAsync_ShouldReturnCustomerOrders()
        {
            using var context = CreateInMemoryDbContext();
            var category = new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps" };
            context.ServiceCategories.Add(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan { Name = "VPS Basic", CategoryId = category.Id, Cpu = "1 vCPU", Ram = "2GB", Storage = "20GB", Bandwidth = "500GB" };
            context.ServicePlans.Add(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice { PlanId = plan.Id, BillingCycle = "Monthly", Price = 100000 };
            context.PlanPrices.Add(price);
            await context.SaveChangesAsync();

            var order = new OrderRequest
            {
                PlanPriceId = price.Id,
                CustomerName = "Nguyễn Khách Hàng",
                CustomerEmail = "customer@example.com",
                CustomerPhone = "0909090909",
                Status = 2
            };
            context.OrderRequests.Add(order);
            await context.SaveChangesAsync();

            var service = new OrderRequestService(context);
            var result = await service.GetCustomerOrdersAsync("customer@example.com");

            Assert.NotNull(result);
            Assert.Single(result);
        }
    }
}
