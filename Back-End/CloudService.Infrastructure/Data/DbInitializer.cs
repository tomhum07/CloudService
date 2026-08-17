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
                var customerRole = new Role { Name = "Customer", Description = "Khách hàng sử dụng dịch vụ" };

                await context.Roles.AddRangeAsync(adminRole, editorRole, customerRole);
                await context.SaveChangesAsync();
            }
            else if (!await context.Roles.AnyAsync(r => r.Name == "Customer"))
            {
                var customerRole = new Role { Name = "Customer", Description = "Khách hàng sử dụng dịch vụ" };
                await context.Roles.AddAsync(customerRole);
                await context.SaveChangesAsync();
            }

            // 2. Seed Users
            if (await context.AppUsers.CountAsync() <= 1)
            {
                var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
                var editorRole = await context.Roles.FirstAsync(r => r.Name == "Editor");

                // Seed admin if not present
                var adminUser = await context.AppUsers.FirstOrDefaultAsync(u => u.Username == "admin");
                if (adminUser == null)
                {
                    adminUser = new AppUser
                    {
                        Username = "admin",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("123123"),
                        FullName = "Hệ thống Admin",
                        Email = "admin@cloudservice.com",
                        RoleId = adminRole.Id
                    };
                    await context.AppUsers.AddAsync(adminUser);
                }

                // Add 4 more mock users to make it 5 total
                var mockUsers = new[]
                {
                    new AppUser { Username = "editor1", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123123"), FullName = "Nguyễn Văn Biên Tập", Email = "editor1@cloudservice.com", RoleId = editorRole.Id },
                    new AppUser { Username = "editor2", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123123"), FullName = "Trần Thị Nội Dung", Email = "editor2@cloudservice.com", RoleId = editorRole.Id },
                    new AppUser { Username = "sales_staff", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123123"), FullName = "Lê Văn Bán Hàng", Email = "sales@cloudservice.com", RoleId = editorRole.Id },
                    new AppUser { Username = "support_staff", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123123"), FullName = "Phạm Hoàng Hỗ Trợ", Email = "support@cloudservice.com", RoleId = editorRole.Id }
                };

                foreach (var u in mockUsers)
                {
                    if (!await context.AppUsers.AnyAsync(user => user.Username == u.Username))
                    {
                        await context.AppUsers.AddAsync(u);
                    }
                }
                await context.SaveChangesAsync();
            }

            // 3. Seed Promotions
            if (!await context.Promotions.AnyAsync())
            {
                var promotions = new[]
                {
                    new Promotion { Name = "Mừng Khai Trương", DiscountPercentage = 10, StartDate = DateTime.UtcNow.AddDays(-5), EndDate = DateTime.UtcNow.AddDays(30) },
                    new Promotion { Name = "Khuyến Mãi Hè rực rỡ", DiscountPercentage = 15, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(20) },
                    new Promotion { Name = "Đăng ký dài hạn 2 năm", DiscountPercentage = 20, StartDate = DateTime.UtcNow.AddDays(-30), EndDate = DateTime.UtcNow.AddDays(180) },
                    new Promotion { Name = "Black Friday Săn Deal", DiscountPercentage = 30, StartDate = DateTime.UtcNow.AddDays(90), EndDate = DateTime.UtcNow.AddDays(95) },
                    new Promotion { Name = "Chào bạn mới - Cloud Start", DiscountPercentage = 5, StartDate = DateTime.UtcNow.AddDays(-60), EndDate = DateTime.UtcNow.AddDays(365) }
                };
                await context.Promotions.AddRangeAsync(promotions);
                await context.SaveChangesAsync();
            }

            // 4. Seed ServiceCategories
            if (!await context.ServiceCategories.AnyAsync())
            {
                var categories = new[]
                {
                    new ServiceCategory { Name = "Cloud VPS", Slug = "cloud-vps", Description = "Máy chủ ảo đám mây hiệu năng cao, tài nguyên riêng biệt." },
                    new ServiceCategory { Name = "Shared Hosting", Slug = "shared-hosting", Description = "Giải pháp lưu trữ web giá rẻ, tối ưu cho WordPress." },
                    new ServiceCategory { Name = "Tên Miền (Domain)", Slug = "domain", Description = "Đăng ký và quản lý tên miền quốc tế và Việt Nam." },
                    new ServiceCategory { Name = "SSL Certificate", Slug = "ssl", Description = "Chứng chỉ bảo mật số mã hóa dữ liệu website." },
                    new ServiceCategory { Name = "Business Email", Slug = "business-email", Description = "Email tên miền doanh nghiệp chuyên nghiệp và bảo mật." }
                };
                await context.ServiceCategories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }

            // 5. Seed ServicePlans
            if (!await context.ServicePlans.AnyAsync())
            {
                var vpsCat = await context.ServiceCategories.FirstAsync(c => c.Slug == "cloud-vps");
                var hostCat = await context.ServiceCategories.FirstAsync(c => c.Slug == "shared-hosting");
                var domCat = await context.ServiceCategories.FirstAsync(c => c.Slug == "domain");
                var sslCat = await context.ServiceCategories.FirstAsync(c => c.Slug == "ssl");
                var emailCat = await context.ServiceCategories.FirstAsync(c => c.Slug == "business-email");

                var plans = new[]
                {
                    new ServicePlan { CategoryId = vpsCat.Id, Name = "Cloud VPS Pro S1", Description = "Phù hợp cho website doanh nghiệp vừa và nhỏ", Cpu = "2 vCPU", Ram = "4 GB RAM", Storage = "50 GB SSD NVMe", Bandwidth = "Không giới hạn", QrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=https://localhost:3000/order/vps-s1" },
                    new ServicePlan { CategoryId = hostCat.Id, Name = "WordPress Hosting Basic", Description = "Tối ưu cho blog cá nhân và web giới thiệu", Cpu = "1 vCPU", Ram = "1 GB RAM", Storage = "10 GB SSD", Bandwidth = "100 GB/Tháng", QrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=https://localhost:3000/order/hosting-basic" },
                    new ServicePlan { CategoryId = domCat.Id, Name = "Domain .COM", Description = "Tên miền phổ biến nhất thế giới", Cpu = "N/A", Ram = "N/A", Storage = "N/A", Bandwidth = "N/A", QrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=https://localhost:3000/order/domain-com" },
                    new ServicePlan { CategoryId = sslCat.Id, Name = "Sectigo PositiveSSL", Description = "Mã hóa https cơ bản và nhanh chóng", Cpu = "N/A", Ram = "N/A", Storage = "N/A", Bandwidth = "N/A", QrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=https://localhost:3000/order/ssl-sectigo" },
                    new ServicePlan { CategoryId = emailCat.Id, Name = "Business Email Pro E1", Description = "Hộp thư tên miền riêng dung lượng lớn", Cpu = "N/A", Ram = "N/A", Storage = "20 GB/Hộp thư", Bandwidth = "Không giới hạn", QrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=https://localhost:3000/order/email-e1" }
                };
                await context.ServicePlans.AddRangeAsync(plans);
                await context.SaveChangesAsync();
            }

            // 6. Seed PlanPrices
            if (!await context.PlanPrices.AnyAsync())
            {
                var vpsPlan = await context.ServicePlans.FirstAsync(p => p.Name == "Cloud VPS Pro S1");
                var hostPlan = await context.ServicePlans.FirstAsync(p => p.Name == "WordPress Hosting Basic");
                var domPlan = await context.ServicePlans.FirstAsync(p => p.Name == "Domain .COM");
                var sslPlan = await context.ServicePlans.FirstAsync(p => p.Name == "Sectigo PositiveSSL");
                var emailPlan = await context.ServicePlans.FirstAsync(p => p.Name == "Business Email Pro E1");

                var promo1 = await context.Promotions.FirstAsync(p => p.Name == "Mừng Khai Trương");
                var promo2 = await context.Promotions.FirstAsync(p => p.Name == "Khuyến Mãi Hè rực rỡ");

                var prices = new[]
                {
                    new PlanPrice { PlanId = vpsPlan.Id, BillingCycle = "Tháng", Price = 250000, PromotionId = promo1.Id },
                    new PlanPrice { PlanId = vpsPlan.Id, BillingCycle = "Năm", Price = 2700000, PromotionId = promo2.Id },
                    new PlanPrice { PlanId = hostPlan.Id, BillingCycle = "Tháng", Price = 50000, PromotionId = null },
                    new PlanPrice { PlanId = hostPlan.Id, BillingCycle = "Năm", Price = 540000, PromotionId = promo1.Id },
                    new PlanPrice { PlanId = domPlan.Id, BillingCycle = "Năm", Price = 350000, PromotionId = null },
                    new PlanPrice { PlanId = sslPlan.Id, BillingCycle = "Năm", Price = 220000, PromotionId = null },
                    new PlanPrice { PlanId = emailPlan.Id, BillingCycle = "Tháng", Price = 30000, PromotionId = null },
                    new PlanPrice { PlanId = emailPlan.Id, BillingCycle = "Năm", Price = 320000, PromotionId = promo1.Id }
                };
                await context.PlanPrices.AddRangeAsync(prices);
                await context.SaveChangesAsync();
            }

            // 7. Seed NewsArticles
            if (!await context.NewsArticles.AnyAsync())
            {
                var admin = await context.AppUsers.FirstAsync(u => u.Username == "admin");
                var articles = new[]
                {
                    new NewsArticle { Title = "Hướng dẫn cấu hình Cloud VPS cho người mới bắt đầu", Slug = "huong-dan-cau-hinh-cloud-vps", Summary = "Bài viết chi tiết giúp bạn làm quen và tự cấu hình máy chủ ảo VPS chạy Linux hoặc Windows.", Content = "Nội dung bài viết hướng dẫn cấu hình VPS: Bước 1: Đăng nhập SSH... Bước 2: Cập nhật hệ thống... Bước 3: Cài đặt Web Server...", AuthorId = admin.Id, PublishedAt = DateTime.UtcNow.AddDays(-2) },
                    new NewsArticle { Title = "Cách trỏ Tên miền về Hosting chi tiết nhất", Slug = "cach-tro-ten-mien-ve-hosting", Summary = "Hướng dẫn cấu hình bản ghi DNS (A record, CNAME) để liên kết tên miền với hosting.", Content = "Nội dung hướng dẫn trỏ tên miền: Truy cập trang quản trị tên miền, tạo bản ghi A trỏ về IP của hosting...", AuthorId = admin.Id, PublishedAt = DateTime.UtcNow.AddDays(-4) },
                    new NewsArticle { Title = "Tại sao website của bạn bắt buộc phải có chứng chỉ SSL?", Slug = "loi-ich-cua-chung-chi-ssl", Summary = "Phân tích tầm quan trọng của HTTPS trong bảo mật thông tin và nâng cao thứ hạng SEO Google.", Content = "Nội dung phân tích SSL: SSL giúp mã hóa dữ liệu từ trình duyệt tới máy chủ, tránh nghe lén thông tin...", AuthorId = admin.Id, PublishedAt = DateTime.UtcNow.AddDays(-1) },
                    new NewsArticle { Title = "5 Mẹo tối ưu hóa bảo mật cho WordPress Shared Hosting", Slug = "meo-bao-mat-wordpress-hosting", Summary = "Các phương pháp bảo mật cơ bản như đổi đường dẫn login, phân quyền file, cài plugin bảo mật.", Content = "Nội dung bảo mật WordPress: Thay đổi user admin mặc định, cài đặt khóa bảo mật, phân quyền thư mục wp-content...", AuthorId = admin.Id, PublishedAt = DateTime.UtcNow.AddDays(-6) },
                    new NewsArticle { Title = "Lợi ích khi doanh nghiệp sở hữu hệ thống Email tên miền riêng", Slug = "loi-ich-email-ten-mien-rieng", Summary = "Tăng độ uy tín thương hiệu, nâng cao khả năng gửi thư vào inbox và bảo mật thông tin nội bộ.", Content = "Nội dung email tên miền riêng: Email có đuôi @company.com giúp tăng tính chuyên nghiệp trong giao tiếp khách hàng...", AuthorId = admin.Id, PublishedAt = DateTime.UtcNow }
                };
                await context.NewsArticles.AddRangeAsync(articles);
                await context.SaveChangesAsync();
            }

            // 8. Seed AffiliateApplications
            if (!await context.AffiliateApplications.AnyAsync())
            {
                var apps = new[]
                {
                    new AffiliateApplication { FullName = "Trần Thanh Bình", Email = "binh.aff@gmail.com", Phone = "0987111222", WebsiteUrl = "https://blogcongnghe.vn", Motivation = "Muốn chia sẻ dịch vụ chất lượng tới độc giả công nghệ.", Status = 2 }, // Approved
                    new AffiliateApplication { FullName = "Phạm Thị Thảo", Email = "thao.aff@gmail.com", Phone = "0987222333", WebsiteUrl = "https://thaoreview.com", Motivation = "Review dịch vụ hosting và VPS kiếm thêm thu nhập.", Status = 1 }, // Processing
                    new AffiliateApplication { FullName = "Lê Hoàng Nam", Email = "nam.aff@gmail.com", Phone = "0987333444", WebsiteUrl = "https://hoangnamcode.net", Motivation = "Nhà phát triển web, muốn cài đặt trực tiếp cho khách hàng.", Status = 2 }, // Approved
                    new AffiliateApplication { FullName = "Vũ Minh Anh", Email = "minhanh.aff@gmail.com", Phone = "0987444555", WebsiteUrl = "https://facebook.com/minhanhshare", Motivation = "Quảng bá qua mạng xã hội cá nhân.", Status = 0 }, // New
                    new AffiliateApplication { FullName = "Đỗ Kim Oanh", Email = "oanh.aff@gmail.com", Phone = "0987555666", WebsiteUrl = "https://spamweb.xyz", Motivation = "Spam forum kiếm hoa hồng.", Status = 3 } // Rejected
                };
                await context.AffiliateApplications.AddRangeAsync(apps);
                await context.SaveChangesAsync();
            }

            // 9. Seed OrderRequests
            if (!await context.OrderRequests.AnyAsync())
            {
                var priceVps = await context.PlanPrices.FirstAsync(p => p.Plan!.Name == "Cloud VPS Pro S1" && p.BillingCycle == "Tháng");
                var priceHost = await context.PlanPrices.FirstAsync(p => p.Plan!.Name == "WordPress Hosting Basic" && p.BillingCycle == "Năm");
                var priceDom = await context.PlanPrices.FirstAsync(p => p.Plan!.Name == "Domain .COM" && p.BillingCycle == "Năm");

                var orders = new[]
                {
                    new OrderRequest { PlanPriceId = priceVps.Id, CustomerName = "Nguyễn Văn Hải", CustomerEmail = "hai.nguyen@gmail.com", CustomerPhone = "0901234567", CompanyName = "Công ty TNHH Hải Nam", Status = 2, Notes = "Cần cài đặt sẵn OS Ubuntu 22.04" }, // Completed
                    new OrderRequest { PlanPriceId = priceHost.Id, CustomerName = "Trần Thị Hoa", CustomerEmail = "hoa.tran@gmail.com", CustomerPhone = "0902345678", CompanyName = null, Status = 1, Notes = "Hỗ trợ di chuyển source code từ bên khác qua" }, // Processing
                    new OrderRequest { PlanPriceId = priceDom.Id, CustomerName = "Lê Văn Đạt", CustomerEmail = "dat.le@gmail.com", CustomerPhone = "0903456789", CompanyName = "Đạt Phát Group", Status = 2, Notes = "Đăng ký tên miền datphatgroup.com" }, // Completed
                    new OrderRequest { PlanPriceId = priceVps.Id, CustomerName = "Phạm Minh Đức", CustomerEmail = "duc.pham@gmail.com", CustomerPhone = "0904567890", CompanyName = null, Status = 0, Notes = "Cài đặt Windows Server 2022" }, // New
                    new OrderRequest { PlanPriceId = priceHost.Id, CustomerName = "Vũ Thị Vân", CustomerEmail = "van.vu@gmail.com", CustomerPhone = "0905678901", CompanyName = "Shop Mỹ Phẩm Vy Vy", Status = 3, Notes = "Yêu cầu hoàn tiền vì lý do khách quan" } // Rejected
                };
                await context.OrderRequests.AddRangeAsync(orders);
                await context.SaveChangesAsync();
            }

            // 10. Seed AuditLogs
            if (!await context.AuditLogs.AnyAsync())
            {
                var admin = await context.AppUsers.FirstAsync(u => u.Username == "admin");
                var logs = new[]
                {
                    new AuditLog { UserId = admin.Id, Username = admin.Username, Action = "Đăng nhập", Payload = "Đăng nhập hệ thống quản trị thành công từ IP 127.0.0.1", Timestamp = DateTime.UtcNow.AddHours(-5) },
                    new AuditLog { UserId = admin.Id, Username = admin.Username, Action = "Cập nhật giá gói dịch vụ", Payload = "Đã thay đổi giá gói Cloud VPS Pro S1 từ 240,000đ thành 250,000đ", Timestamp = DateTime.UtcNow.AddHours(-4) },
                    new AuditLog { UserId = admin.Id, Username = admin.Username, Action = "Duyệt yêu cầu đăng ký đối tác", Payload = "Đã duyệt đơn đăng ký Affiliate của đối tác Trần Thanh Bình", Timestamp = DateTime.UtcNow.AddHours(-3) },
                    new AuditLog { UserId = admin.Id, Username = admin.Username, Action = "Đăng bài viết mới", Payload = "Đã đăng bài viết 'Hướng dẫn cấu hình Cloud VPS cho người mới bắt đầu'", Timestamp = DateTime.UtcNow.AddHours(-2) },
                    new AuditLog { UserId = admin.Id, Username = admin.Username, Action = "Xử lý đơn đặt hàng", Payload = "Đã chuyển trạng thái đơn hàng #1 của khách hàng Nguyễn Văn Hải sang Hoàn tất", Timestamp = DateTime.UtcNow.AddHours(-1) }
                };
                await context.AuditLogs.AddRangeAsync(logs);
                await context.SaveChangesAsync();
            }
        }
    }
}
