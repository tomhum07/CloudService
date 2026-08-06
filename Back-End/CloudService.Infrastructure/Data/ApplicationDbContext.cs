using Microsoft.EntityFrameworkCore;
using CloudService.Domain.Entities;

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
