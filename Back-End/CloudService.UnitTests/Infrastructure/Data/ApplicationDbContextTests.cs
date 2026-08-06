using System;
using System.Linq;
using CloudService.Domain.Entities;
using CloudService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CloudService.UnitTests.Infrastructure.Data
{
    public class ApplicationDbContextTests
    {
        private ApplicationDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=TestDb;Trusted_Connection=True;")
                .Options;

            return new ApplicationDbContext(options);
        }

        private ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        [Fact]
        public void DbContext_ShouldContainAllNineEntities()
        {
            using var context = CreateDbContext();
            var model = context.Model;

            Assert.NotNull(model.FindEntityType(typeof(Role)));
            Assert.NotNull(model.FindEntityType(typeof(AppUser)));
            Assert.NotNull(model.FindEntityType(typeof(ServiceCategory)));
            Assert.NotNull(model.FindEntityType(typeof(ServicePlan)));
            Assert.NotNull(model.FindEntityType(typeof(PlanPrice)));
            Assert.NotNull(model.FindEntityType(typeof(Promotion)));
            Assert.NotNull(model.FindEntityType(typeof(OrderRequest)));
            Assert.NotNull(model.FindEntityType(typeof(AffiliateApplication)));
            Assert.NotNull(model.FindEntityType(typeof(AuditLog)));
        }

        [Fact]
        public void RoleConfiguration_ShouldConfigureTableAndProperties()
        {
            using var context = CreateDbContext();
            var entityType = context.Model.FindEntityType(typeof(Role))!;

            Assert.Equal("Roles", entityType.GetTableName());
            
            var nameProp = entityType.FindProperty(nameof(Role.Name))!;
            Assert.False(nameProp.IsNullable);
            Assert.Equal(50, nameProp.GetMaxLength());

            var descProp = entityType.FindProperty(nameof(Role.Description))!;
            Assert.True(descProp.IsNullable);
            Assert.Equal(250, descProp.GetMaxLength());
        }

        [Fact]
        public void AppUserConfiguration_ShouldConfigurePropertiesAndIndexesAndRelationships()
        {
            using var context = CreateDbContext();
            var entityType = context.Model.FindEntityType(typeof(AppUser))!;

            Assert.Equal("AppUsers", entityType.GetTableName());

            var usernameProp = entityType.FindProperty(nameof(AppUser.Username))!;
            Assert.False(usernameProp.IsNullable);
            Assert.Equal(50, usernameProp.GetMaxLength());

            var pwdProp = entityType.FindProperty(nameof(AppUser.PasswordHash))!;
            Assert.False(pwdProp.IsNullable);
            Assert.Equal(255, pwdProp.GetMaxLength());

            var emailProp = entityType.FindProperty(nameof(AppUser.Email))!;
            Assert.False(emailProp.IsNullable);
            Assert.Equal(100, emailProp.GetMaxLength());

            // Unique indexes
            var usernameIndex = entityType.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(AppUser.Username)));
            Assert.NotNull(usernameIndex);
            Assert.True(usernameIndex.IsUnique);

            var emailIndex = entityType.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(AppUser.Email)));
            Assert.NotNull(emailIndex);
            Assert.True(emailIndex.IsUnique);

            // Foreign Key DeleteBehavior
            var roleFk = entityType.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(Role));
            Assert.NotNull(roleFk);
            Assert.Equal(DeleteBehavior.Restrict, roleFk.DeleteBehavior);
        }

        [Fact]
        public void ServiceCategoryAndPlan_ShouldConfigureRelationshipsAndLimits()
        {
            using var context = CreateDbContext();

            var categoryType = context.Model.FindEntityType(typeof(ServiceCategory))!;
            Assert.Equal("ServiceCategories", categoryType.GetTableName());
            var slugProp = categoryType.FindProperty(nameof(ServiceCategory.Slug))!;
            Assert.Equal(150, slugProp.GetMaxLength());
            var catDescProp = categoryType.FindProperty(nameof(ServiceCategory.Description))!;
            Assert.Equal(2000, catDescProp.GetMaxLength());

            var planType = context.Model.FindEntityType(typeof(ServicePlan))!;
            Assert.Equal("ServicePlans", planType.GetTableName());
            var planDescProp = planType.FindProperty(nameof(ServicePlan.Description))!;
            Assert.Equal(4000, planDescProp.GetMaxLength());
            var planCategoryFk = planType.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(ServiceCategory));
            Assert.NotNull(planCategoryFk);
            Assert.Equal(DeleteBehavior.Restrict, planCategoryFk.DeleteBehavior);
        }

        [Fact]
        public void PlanPrice_ShouldConfigureDeleteBehaviorsAndColumnType()
        {
            using var context = CreateDbContext();
            var entityType = context.Model.FindEntityType(typeof(PlanPrice))!;

            Assert.Equal("PlanPrices", entityType.GetTableName());
            var priceProp = entityType.FindProperty(nameof(PlanPrice.Price))!;
            Assert.Equal("decimal(18,2)", priceProp.GetColumnType());

            var planFk = entityType.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(ServicePlan));
            Assert.NotNull(planFk);
            Assert.Equal(DeleteBehavior.Cascade, planFk.DeleteBehavior);

            var promoFk = entityType.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(Promotion));
            Assert.NotNull(promoFk);
            Assert.Equal(DeleteBehavior.SetNull, promoFk.DeleteBehavior);
        }

        [Fact]
        public void AuditLog_ShouldConfigureSetNullDeleteBehaviorAndPayloadColumnType()
        {
            using var context = CreateDbContext();
            var entityType = context.Model.FindEntityType(typeof(AuditLog))!;

            Assert.Equal("AuditLogs", entityType.GetTableName());

            var payloadProp = entityType.FindProperty(nameof(AuditLog.Payload))!;
            Assert.Equal("nvarchar(max)", payloadProp.GetColumnType());

            var userFk = entityType.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(AppUser));
            Assert.NotNull(userFk);
            Assert.Equal(DeleteBehavior.SetNull, userFk.DeleteBehavior);
        }

        [Fact]
        public void AffiliateApplication_ShouldConfigureMotivationMaxLength()
        {
            using var context = CreateDbContext();
            var entityType = context.Model.FindEntityType(typeof(AffiliateApplication))!;

            var motivationProp = entityType.FindProperty(nameof(AffiliateApplication.Motivation))!;
            Assert.Equal(2000, motivationProp.GetMaxLength());
        }

        [Fact]
        public void BaseEntities_ShouldHaveIsActiveDefaultValueTrue()
        {
            using var context = CreateDbContext();
            foreach (var entityType in context.Model.GetEntityTypes())
            {
                if (typeof(CloudService.Domain.Common.BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var isActiveProp = entityType.FindProperty("IsActive");
                    Assert.NotNull(isActiveProp);
                    Assert.Equal(true, isActiveProp.GetDefaultValue());
                }
            }
        }

        [Fact]
        public void DbContext_CanSaveAndRetrieveData()
        {
            using var context = CreateInMemoryDbContext();

            var role = new Role { Name = "Admin", Description = "Administrator Role" };
            context.Roles.Add(role);
            context.SaveChanges();

            var savedRole = context.Roles.FirstOrDefault(r => r.Name == "Admin");
            Assert.NotNull(savedRole);
            Assert.Equal("Administrator Role", savedRole.Description);
            Assert.True(savedRole.Id > 0);
            Assert.True(savedRole.IsActive);
        }
    }
}
