using Microsoft.EntityFrameworkCore;
using CloudService.Domain.Entities;
using CloudService.Domain.Common;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;

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
        public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
        public DbSet<Testimonial> Testimonials => Set<Testimonial>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

            // Configure IsActive default and Global Query Filter for Soft Delete
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property("IsActive")
                        .HasDefaultValue(true);

                    // Add global query filter for soft delete
                    modelBuilder.Entity(entityType.ClrType)
                        .HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
                }
            }
        }

        private static LambdaExpression ConvertFilterExpression(Type type)
        {
            var parameter = Expression.Parameter(type, "e");
            var property = Expression.Property(parameter, "IsActive");
            var body = Expression.Equal(property, Expression.Constant(true));
            return Expression.Lambda(body, parameter);
        }

        public override int SaveChanges()
        {
            UpdateAuditFields();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateAuditFields();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateAuditFields()
        {
            var entries = ChangeTracker.Entries<BaseEntity>();
            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.IsActive = true;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.LastModifiedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
