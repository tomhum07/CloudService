# Database & EF Core Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ sở dữ liệu quan hệ (SQL Server) bằng phương thức EF Core Code-First bao gồm thiết lập Domain Entities, các cấu hình Fluent API ở Infrastructure, chạy Migrations và Seeding dữ liệu vai trò/tài khoản Admin mẫu trên đám mây Azure SQL.

**Architecture:** Áp dụng Clean Architecture. Khai báo các Entities tại tầng Domain mà không phụ thuộc vào EF Core. Định nghĩa DbContext và các lớp cấu hình EntityTypeConfiguration tại tầng Infrastructure. Sử dụng WebApi làm dự án chạy khởi tạo Migration.

**Tech Stack:** C# .NET 10, Entity Framework Core 10, Microsoft.EntityFrameworkCore.SqlServer.

## Global Constraints
- Target Framework: `net10.0`
- Khóa chính kiểu số nguyên tự tăng (`int`).
- Áp dụng cơ chế xóa mềm (Soft Delete) qua cột `IsActive` (mặc định `true`).
- Toàn bộ thuộc tính chuỗi (string) trong database phải được cấu hình giới hạn ký tự (MaxLength) rõ ràng, không dùng kiểu ngầm định `NVARCHAR(MAX)` trừ trường mô tả chi tiết.

---

### Task 1: Thiết lập Domain Entities và BaseEntity

**Files:**
- Create: `BE/CloudService.Domain/Common/BaseEntity.cs`
- Create: `BE/CloudService.Domain/Entities/Role.cs`
- Create: `BE/CloudService.Domain/Entities/AppUser.cs`
- Create: `BE/CloudService.Domain/Entities/ServiceCategory.cs`
- Create: `BE/CloudService.Domain/Entities/ServicePlan.cs`
- Create: `BE/CloudService.Domain/Entities/Promotion.cs`
- Create: `BE/CloudService.Domain/Entities/PlanPrice.cs`
- Create: `BE/CloudService.Domain/Entities/OrderRequest.cs`
- Create: `BE/CloudService.Domain/Entities/AffiliateApplication.cs`
- Create: `BE/CloudService.Domain/Entities/AuditLog.cs`
- Test: `BE/CloudService.UnitTests/Domain/Entities/EntityTests.cs`

**Interfaces:**
- Produces: Lớp thực thể kế thừa `BaseEntity` dùng cho DbContext tại Infrastructure.

- [ ] **Step 1: Viết test kiểm tra trạng thái khởi tạo mặc định của thực thể**

Tạo file `BE/CloudService.UnitTests/Domain/Entities/EntityTests.cs` với nội dung:
```csharp
using Xunit;
using CloudService.Domain.Entities;

namespace CloudService.UnitTests.Domain.Entities
{
    public class EntityTests
    {
        [Fact]
        public void ServicePlan_Creation_ShouldHaveDefaultIsActiveTrue()
        {
            var plan = new ServicePlan();
            Assert.True(plan.IsActive);
        }
    }
}
```

- [ ] **Step 2: Chạy test để xác nhận biên dịch lỗi (vì chưa có thực thể)**

Chạy trong Terminal:
```bash
dotnet test BE/CloudService.UnitTests/CloudService.UnitTests.csproj
```
Kết quả mong muốn: Biên dịch lỗi do thiếu namespace `CloudService.Domain.Entities` và class `ServicePlan`.

- [ ] **Step 3: Tạo lớp BaseEntity.cs**

Tạo file `BE/CloudService.Domain/Common/BaseEntity.cs`:
```csharp
using System;

namespace CloudService.Domain.Common
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastModifiedAt { get; set; }
    }
}
```

- [ ] **Step 4: Tạo các file thực thể (Entities)**

Tạo file `BE/CloudService.Domain/Entities/Role.cs`:
```csharp
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class Role : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/AppUser.cs`:
```csharp
using System;
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class AppUser : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public virtual Role? Role { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/ServiceCategory.cs`:
```csharp
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class ServiceCategory : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public virtual ICollection<ServicePlan> Plans { get; set; } = new List<ServicePlan>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/ServicePlan.cs`:
```csharp
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class ServicePlan : BaseEntity
    {
        public int CategoryId { get; set; }
        public virtual ServiceCategory? Category { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? Storage { get; set; }
        public string? Bandwidth { get; set; }
        public string? QrCodeUrl { get; set; }
        public virtual ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/Promotion.cs`:
```csharp
using System;
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class Promotion : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int DiscountPercentage { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public virtual ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/PlanPrice.cs`:
```csharp
using System.Collections.Generic;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class PlanPrice : BaseEntity
    {
        public int PlanId { get; set; }
        public virtual ServicePlan? Plan { get; set; }
        public string BillingCycle { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? PromotionId { get; set; }
        public virtual Promotion? Promotion { get; set; }
        public virtual ICollection<OrderRequest> Orders { get; set; } = new List<OrderRequest>();
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/OrderRequest.cs`:
```csharp
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class OrderRequest : BaseEntity
    {
        public int PlanPriceId { get; set; }
        public virtual PlanPrice? PlanPrice { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public int Status { get; set; } = 0; // 0: New, 1: Processing, 2: Completed, 3: Rejected
        public string? Notes { get; set; }
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/AffiliateApplication.cs`:
```csharp
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class AffiliateApplication : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? WebsiteUrl { get; set; }
        public string? Motivation { get; set; }
        public int Status { get; set; } = 0; // 0: New, 1: Processing, 2: Approved, 3: Rejected
    }
}
```

Tạo file `BE/CloudService.Domain/Entities/AuditLog.cs`:
```csharp
using System;
using CloudService.Domain.Common;

namespace CloudService.Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        public int? UserId { get; set; }
        public virtual AppUser? User { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Payload { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
```

- [ ] **Step 5: Chạy lại test để xác nhận thành công**

Chạy trong Terminal:
```bash
dotnet test BE/CloudService.UnitTests/CloudService.UnitTests.csproj
```
Kết quả mong muốn: `Passed`

- [ ] **Step 6: Commit lên Git**

Chạy:
```bash
git add BE/CloudService.Domain/ BE/CloudService.UnitTests/
git commit -m "feat(domain): add base entity and core domain models"
```

---

### Task 2: Cài đặt DbContext và các lớp cấu hình Fluent API

**Files:**
- Create: `BE/CloudService.Infrastructure/Data/ApplicationDbContext.cs`
- Create: `BE/CloudService.Infrastructure/Data/Configurations/EntityConfigurations.cs`
- Modify: `BE/CloudService.Infrastructure/CloudService.Infrastructure.csproj`

**Interfaces:**
- Consumes: Domain Entities của tầng Domain.

- [ ] **Step 1: Cài đặt các package EF Core cần thiết vào Infrastructure**

Chạy trong Terminal:
```bash
cd BE/CloudService.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Relational
cd ../..
```

- [ ] **Step 2: Viết cấu hình Fluent API chi tiết cho các thực thể**

Tạo file `BE/CloudService.Infrastructure/Data/Configurations/EntityConfigurations.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CloudService.Domain.Entities;

namespace CloudService.Infrastructure.Data.Configurations
{
    public class RoleConfiguration : IEntityTypeConfiguration<Role>
    {
        public void Configure(EntityTypeBuilder<Role> builder)
        {
            builder.ToTable("Roles");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Name).HasMaxLength(50).IsRequired();
            builder.HasIndex(r => r.Name).IsUnique();
            builder.Property(r => r.Description).HasMaxLength(250);
        }
    }

    public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
    {
        public void Configure(EntityTypeBuilder<AppUser> builder)
        {
            builder.ToTable("AppUsers");
            builder.HasKey(u => u.Id);
            builder.Property(u => u.Username).HasMaxLength(50).IsRequired();
            builder.HasIndex(u => u.Username).IsUnique();
            builder.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();
            builder.Property(u => u.FullName).HasMaxLength(100).IsRequired();
            builder.Property(u => u.Email).HasMaxLength(100).IsRequired();
            builder.HasIndex(u => u.Email).IsUnique();
            builder.Property(u => u.RefreshToken).HasMaxLength(255);
            
            builder.HasOne(u => u.Role)
                   .WithMany(r => r.Users)
                   .HasForeignKey(u => u.RoleId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class ServiceCategoryConfiguration : IEntityTypeConfiguration<ServiceCategory>
    {
        public void Configure(EntityTypeBuilder<ServiceCategory> builder)
        {
            builder.ToTable("ServiceCategories");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
            builder.Property(c => c.Slug).HasMaxLength(150).IsRequired();
            builder.HasIndex(c => c.Slug).IsUnique();
        }
    }

    public class ServicePlanConfiguration : IEntityTypeConfiguration<ServicePlan>
    {
        public void Configure(EntityTypeBuilder<ServicePlan> builder)
        {
            builder.ToTable("ServicePlans");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
            builder.Property(p => p.Cpu).HasMaxLength(50);
            builder.Property(p => p.Ram).HasMaxLength(50);
            builder.Property(p => p.Storage).HasMaxLength(50);
            builder.Property(p => p.Bandwidth).HasMaxLength(50);
            builder.Property(p => p.QrCodeUrl).HasMaxLength(255);

            builder.HasOne(p => p.Category)
                   .WithMany(c => c.Plans)
                   .HasForeignKey(p => p.CategoryId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class PlanPriceConfiguration : IEntityTypeConfiguration<PlanPrice>
    {
        public void Configure(EntityTypeBuilder<PlanPrice> builder)
        {
            builder.ToTable("PlanPrices");
            builder.HasKey(pr => pr.Id);
            builder.Property(pr => pr.BillingCycle).HasMaxLength(50).IsRequired();
            builder.Property(pr => pr.Price).HasColumnType("decimal(18,2)").IsRequired();

            builder.HasOne(pr => pr.Plan)
                   .WithMany(p => p.Prices)
                   .HasForeignKey(pr => pr.PlanId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pr => pr.Promotion)
                   .WithMany(promo => promo.Prices)
                   .HasForeignKey(pr => pr.PromotionId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
    {
        public void Configure(EntityTypeBuilder<Promotion> builder)
        {
            builder.ToTable("Promotions");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).HasMaxLength(150).IsRequired();
            builder.Property(p => p.DiscountPercentage).IsRequired();
        }
    }

    public class OrderRequestConfiguration : IEntityTypeConfiguration<OrderRequest>
    {
        public void Configure(EntityTypeBuilder<OrderRequest> builder)
        {
            builder.ToTable("OrderRequests");
            builder.HasKey(o => o.Id);
            builder.Property(o => o.CustomerName).HasMaxLength(100).IsRequired();
            builder.Property(o => o.CustomerEmail).HasMaxLength(100).IsRequired();
            builder.Property(o => o.CustomerPhone).HasMaxLength(20).IsRequired();
            builder.Property(o => o.CompanyName).HasMaxLength(150);
            builder.Property(o => o.Notes).HasMaxLength(500);

            builder.HasOne(o => o.PlanPrice)
                   .WithMany(p => p.Orders)
                   .HasForeignKey(o => o.PlanPriceId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class AffiliateApplicationConfiguration : IEntityTypeConfiguration<AffiliateApplication>
    {
        public void Configure(EntityTypeBuilder<AffiliateApplication> builder)
        {
            builder.ToTable("AffiliateApplications");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.FullName).HasMaxLength(100).IsRequired();
            builder.Property(a => a.Email).HasMaxLength(100).IsRequired();
            builder.HasIndex(a => a.Email).IsUnique();
            builder.Property(a => a.Phone).HasMaxLength(20).IsRequired();
            builder.Property(a => a.WebsiteUrl).HasMaxLength(255);
        }
    }

    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Username).HasMaxLength(50).IsRequired();
            builder.Property(a => a.Action).HasMaxLength(100).IsRequired();

            builder.HasOne(a => a.User)
                   .WithMany(u => u.AuditLogs)
                   .HasForeignKey(a => a.UserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
```

- [ ] **Step 3: Tạo tệp DbContext liên kết các cấu hình**

Tạo file `BE/CloudService.Infrastructure/Data/ApplicationDbContext.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data.Configurations;

namespace CloudService.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<AppUser> AppUsers => Set<AppUser>();
        public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
        public DbSet<ServicePlan> ServicePlans => Set<ServicePlan>();
        public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();
        public DbSet<Promotion> Promotions => Set<Promotion>();
        public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();
        public DbSet<AffiliateApplication> AffiliateApplications => Set<AffiliateApplication>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Tự động load toàn bộ cấu hình IEntityTypeConfiguration trong assembly
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
```

- [ ] **Step 4: Biên dịch kiểm tra lỗi**

Chạy lệnh trong Terminal:
```bash
dotnet build BE/CloudService.sln
```
Kết quả mong muốn: `Build succeeded` không có lỗi đỏ.

- [ ] **Step 5: Commit lên Git**

Chạy:
```bash
git add BE/CloudService.Infrastructure/
git commit -m "feat(infra): setup EF Core DbContext and Fluent API configurations"
```

---

### Task 3: Cấu hình Connection String, Seeding Dữ Liệu và Migrations

**Files:**
- Modify: `BE/CloudService.WebApi/Program.cs`
- Modify: `BE/CloudService.WebApi/appsettings.json`
- Create: `BE/CloudService.Infrastructure/Data/DbInitializer.cs`

**Interfaces:**
- Consumes: DbContext ở tầng Infrastructure để thực hiện Migrations và Seed.

- [ ] **Step 1: Đăng ký DbContext và công cụ Tool vào dự án WebApi**

Chạy trong Terminal:
```bash
cd BE/CloudService.WebApi
dotnet add package Microsoft.EntityFrameworkCore.Design
cd ../..
```

- [ ] **Step 2: Viết DbInitializer.cs để Seed dữ liệu mặc định**

Tạo file `BE/CloudService.Infrastructure/Data/DbInitializer.cs` để tạo sẵn vai trò và tài khoản Admin mặc định khi chạy migration:
```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CloudService.Domain.Entities;

namespace CloudService.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Tự động Migrate database nếu chưa có cấu trúc
            await context.Database.MigrateAsync();

            // 1. Seed Roles nếu chưa tồn tại
            if (!await context.Roles.AnyAsync())
            {
                var adminRole = new Role { Name = "Admin", Description = "Quản trị viên tối cao" };
                var editorRole = new Role { Name = "Editor", Description = "Biên tập viên nội dung" };

                await context.Roles.AddRangeAsync(adminRole, editorRole);
                await context.SaveChangesAsync();
            }

            // 2. Seed Admin User mặc định
            if (!await context.AppUsers.AnyAsync())
            {
                var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
                
                // Mật khẩu hash mặc định của "Admin123!" bằng Bcrypt
                string defaultPasswordHash = "$2a$11$wK1b0bYV86wJvq3Lptc2Iu2f3qE61PecqE8.V0s2K1Rj9W0qR/s6C"; 

                var defaultAdmin = new AppUser
                {
                    Username = "admin",
                    PasswordHash = defaultPasswordHash,
                    FullName = "Hệ thống Admin",
                    Email = "admin@cloudservice.com",
                    RoleId = adminRole.Id
                };

                await context.AppUsers.AddAsync(defaultAdmin);
                await context.SaveChangesAsync();
            }
        }
    }
}
```

- [ ] **Step 3: Cấu hình DbContext và Seed dữ liệu trong Program.cs**

Chỉnh sửa [Program.cs](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/Back-End/CloudService.WebApi/Program.cs) để nạp cấu hình cơ sở dữ liệu:
```csharp
using Microsoft.EntityFrameworkCore;
using CloudService.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình Database SQL Server từ Connection String
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("CloudService.Infrastructure")));

// ... (giữ nguyên phần CORS đã thêm)
```
Và gọi logic Seed ở cuối `Program.cs` trước `app.Run()`:
```csharp
// ...
app.UseAuthorization();
app.MapControllers();

// Khởi chạy Migrations và Seed Dữ liệu tự động lúc khởi động
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await DbInitializer.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi trong quá trình khởi tạo dữ liệu CSDL.");
    }
}

app.Run();
```

- [ ] **Step 4: Điền Connection String tạm thời vào appsettings.json**

Thêm chuỗi kết nối vào file `appsettings.json` của WebApi để test:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CloudServiceDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```
*(Lưu ý: Khi deploy hoặc chạy thực tế, chuỗi kết nối sẽ được ghi đè bằng Connection String của Azure SQL)*

- [ ] **Step 5: Tiến hành tạo bản Migration đầu tiên**

Chạy trong Terminal để kiểm tra cú pháp Migration:
```bash
# Đứng tại thư mục gốc BTL_PTPMHDT
dotnet ef migrations add InitialCreate --project BE/CloudService.Infrastructure --startup-project BE/CloudService.WebApi --output-dir Data/Migrations
```
Kết quả mong muốn: Biên dịch thành công và sinh ra thư mục `Data/Migrations` chứa các file SQL C# khởi tạo.

- [ ] **Step 6: Commit hoàn thành kế hoạch lên Git**

Chạy:
```bash
git add BE/
git commit -m "feat(database): setup db initialization, connection string, seeding, and migration"
```
