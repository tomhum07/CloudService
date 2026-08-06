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
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }

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
