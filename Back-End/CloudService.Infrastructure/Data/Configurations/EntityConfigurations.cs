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
            builder.Property(c => c.Description).HasMaxLength(2000);
        }
    }

    public class ServicePlanConfiguration : IEntityTypeConfiguration<ServicePlan>
    {
        public void Configure(EntityTypeBuilder<ServicePlan> builder)
        {
            builder.ToTable("ServicePlans");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
            builder.Property(p => p.Description).HasMaxLength(4000);
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
            builder.Property(pr => pr.Price).HasPrecision(18, 2).IsRequired();

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
            builder.Property(a => a.Phone).HasMaxLength(20).IsRequired();
            builder.Property(a => a.WebsiteUrl).HasMaxLength(255);
            builder.Property(a => a.Motivation).HasMaxLength(2000);
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
            builder.Property(a => a.Payload);

            builder.HasOne(a => a.User)
                   .WithMany(u => u.AuditLogs)
                   .HasForeignKey(a => a.UserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class NewsArticleConfiguration : IEntityTypeConfiguration<NewsArticle>
    {
        public void Configure(EntityTypeBuilder<NewsArticle> builder)
        {
            builder.ToTable("NewsArticles");
            builder.HasKey(n => n.Id);
            builder.Property(n => n.Title).HasMaxLength(250).IsRequired();
            builder.Property(n => n.Slug).HasMaxLength(300).IsRequired();
            builder.HasIndex(n => n.Slug).IsUnique();
            builder.Property(n => n.Summary).HasMaxLength(1000);
            builder.Property(n => n.ThumbnailUrl).HasMaxLength(1000);
            builder.Property(n => n.Content).IsRequired();

            builder.HasOne(n => n.Author)
                   .WithMany(u => u.NewsArticles)
                   .HasForeignKey(n => n.AuthorId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
