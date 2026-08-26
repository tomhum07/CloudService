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
            try
            {
                if (context.Database.IsRelational())
                {
                    await context.Database.MigrateAsync();
                    try
                    {
                        await context.Database.ExecuteSqlRawAsync(@"
                            DO $$ 
                            BEGIN 
                                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='NewsArticles' AND column_name='Category') THEN
                                    ALTER TABLE ""NewsArticles"" ADD COLUMN ""Category"" VARCHAR(100) DEFAULT 'Tin Tức';
                                END IF;
                            END $$;
                        ");
                    }
                    catch { }
                }
                else
                {
                    await context.Database.EnsureCreatedAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DbInitializer Info] Migration check skipped: {ex.Message}");
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

            // 3. Seed Promotions (Mã giảm giá theo từng gói cước)
            var planSpecificPromos = new[]
            {
                // Mã riêng cho gói Cloud VPS
                new Promotion { Name = "VPSPRO10", DiscountPercentage = 10, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },
                new Promotion { Name = "VPSSTART20", DiscountPercentage = 20, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },

                // Mã riêng cho gói WordPress Hosting
                new Promotion { Name = "HOSTING15", DiscountPercentage = 15, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },
                new Promotion { Name = "WPSPECIAL25", DiscountPercentage = 25, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },

                // Mã riêng cho gói Tên Miền
                new Promotion { Name = "DOMAIN5", DiscountPercentage = 5, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },
                new Promotion { Name = "COMDEAL10", DiscountPercentage = 10, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },

                // Mã riêng cho gói SSL Certificate
                new Promotion { Name = "SSLPRO15", DiscountPercentage = 15, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },
                new Promotion { Name = "SECURE20", DiscountPercentage = 20, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },

                // Mã riêng cho gói Business Email
                new Promotion { Name = "EMAILBIZ10", DiscountPercentage = 10, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) },
                new Promotion { Name = "CORPMAIL20", DiscountPercentage = 20, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(180) }
            };

            foreach (var promo in planSpecificPromos)
            {
                if (!await context.Promotions.AnyAsync(p => p.Name == promo.Name))
                {
                    await context.Promotions.AddAsync(promo);
                }
            }
            await context.SaveChangesAsync();

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
                    new ServicePlan { CategoryId = vpsCat.Id, Name = "Cloud VPS Pro S1", Description = "Phù hợp cho website doanh nghiệp vừa và nhỏ", Cpu = "2 vCPU", Ram = "4 GB RAM", Storage = "50 GB SSD NVMe", Bandwidth = "Không giới hạn", QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Ftomhum07.me%2Forder%3FplanId%3D1" },
                    new ServicePlan { CategoryId = hostCat.Id, Name = "WordPress Hosting Basic", Description = "Tối ưu cho blog cá nhân và web giới thiệu", Cpu = "1 vCPU", Ram = "1 GB RAM", Storage = "10 GB SSD", Bandwidth = "100 GB/Tháng", QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Ftomhum07.me%2Forder%3FplanId%3D2" },
                    new ServicePlan { CategoryId = domCat.Id, Name = "Domain .COM", Description = "Tên miền phổ biến nhất thế giới", Cpu = "N/A", Ram = "N/A", Storage = "N/A", Bandwidth = "N/A", QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Ftomhum07.me%2Forder%3FplanId%3D3" },
                    new ServicePlan { CategoryId = sslCat.Id, Name = "Sectigo PositiveSSL", Description = "Mã hóa https cơ bản và nhanh chóng", Cpu = "N/A", Ram = "N/A", Storage = "N/A", Bandwidth = "N/A", QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Ftomhum07.me%2Forder%3FplanId%3D4" },
                    new ServicePlan { CategoryId = emailCat.Id, Name = "Business Email Pro E1", Description = "Hộp thư tên miền riêng dung lượng lớn", Cpu = "N/A", Ram = "N/A", Storage = "20 GB/Hộp thư", Bandwidth = "Không giới hạn", QrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Ftomhum07.me%2Forder%3FplanId%3D5" }
                };
                await context.ServicePlans.AddRangeAsync(plans);
                await context.SaveChangesAsync();
            }

            // 6. Seed PlanPrices (Mỗi gói có các chu kỳ và được gán mã giảm giá riêng)
            var allPlans = await context.ServicePlans.ToListAsync();
            var allPromos = await context.Promotions.ToListAsync();

            var vpsPlan = allPlans.FirstOrDefault(p => p.Name == "Cloud VPS Pro S1");
            var hostPlan = allPlans.FirstOrDefault(p => p.Name == "WordPress Hosting Basic");
            var domPlan = allPlans.FirstOrDefault(p => p.Name == "Domain .COM");
            var sslPlan = allPlans.FirstOrDefault(p => p.Name == "Sectigo PositiveSSL");
            var emailPlan = allPlans.FirstOrDefault(p => p.Name == "Business Email Pro E1");

            var promoVps1 = allPromos.FirstOrDefault(p => p.Name == "VPSPRO10");
            var promoVps2 = allPromos.FirstOrDefault(p => p.Name == "VPSSTART20");
            var promoHost1 = allPromos.FirstOrDefault(p => p.Name == "HOSTING15");
            var promoHost2 = allPromos.FirstOrDefault(p => p.Name == "WPSPECIAL25");
            var promoDom1 = allPromos.FirstOrDefault(p => p.Name == "DOMAIN5");
            var promoDom2 = allPromos.FirstOrDefault(p => p.Name == "COMDEAL10");
            var promoSsl1 = allPromos.FirstOrDefault(p => p.Name == "SSLPRO15");
            var promoSsl2 = allPromos.FirstOrDefault(p => p.Name == "SECURE20");
            var promoEmail1 = allPromos.FirstOrDefault(p => p.Name == "EMAILBIZ10");
            var promoEmail2 = allPromos.FirstOrDefault(p => p.Name == "CORPMAIL20");

            if (!await context.PlanPrices.AnyAsync())
            {
                var initialPrices = new List<PlanPrice>();

                if (vpsPlan != null)
                {
                    initialPrices.Add(new PlanPrice { PlanId = vpsPlan.Id, BillingCycle = "Tháng", Price = 250000, PromotionId = promoVps1?.Id });
                    initialPrices.Add(new PlanPrice { PlanId = vpsPlan.Id, BillingCycle = "Năm", Price = 2700000, PromotionId = promoVps2?.Id });
                }
                if (hostPlan != null)
                {
                    initialPrices.Add(new PlanPrice { PlanId = hostPlan.Id, BillingCycle = "Tháng", Price = 50000, PromotionId = promoHost1?.Id });
                    initialPrices.Add(new PlanPrice { PlanId = hostPlan.Id, BillingCycle = "Năm", Price = 540000, PromotionId = promoHost2?.Id });
                }
                if (domPlan != null)
                {
                    initialPrices.Add(new PlanPrice { PlanId = domPlan.Id, BillingCycle = "Tháng", Price = 35000, PromotionId = promoDom1?.Id });
                    initialPrices.Add(new PlanPrice { PlanId = domPlan.Id, BillingCycle = "Năm", Price = 350000, PromotionId = promoDom2?.Id });
                }
                if (sslPlan != null)
                {
                    initialPrices.Add(new PlanPrice { PlanId = sslPlan.Id, BillingCycle = "Tháng", Price = 25000, PromotionId = promoSsl1?.Id });
                    initialPrices.Add(new PlanPrice { PlanId = sslPlan.Id, BillingCycle = "Năm", Price = 220000, PromotionId = promoSsl2?.Id });
                }
                if (emailPlan != null)
                {
                    initialPrices.Add(new PlanPrice { PlanId = emailPlan.Id, BillingCycle = "Tháng", Price = 30000, PromotionId = promoEmail1?.Id });
                    initialPrices.Add(new PlanPrice { PlanId = emailPlan.Id, BillingCycle = "Năm", Price = 320000, PromotionId = promoEmail2?.Id });
                }

                await context.PlanPrices.AddRangeAsync(initialPrices);
                await context.SaveChangesAsync();
            }
            else
            {
                // Cập nhật liên kết mã riêng nếu bảng PlanPrices đã tồn tại từ trước
                var existingPrices = await context.PlanPrices.ToListAsync();
                foreach (var price in existingPrices)
                {
                    if (vpsPlan != null && price.PlanId == vpsPlan.Id && price.PromotionId == null)
                    {
                        price.PromotionId = price.BillingCycle == "Năm" ? promoVps2?.Id : promoVps1?.Id;
                    }
                    else if (hostPlan != null && price.PlanId == hostPlan.Id && price.PromotionId == null)
                    {
                        price.PromotionId = price.BillingCycle == "Năm" ? promoHost2?.Id : promoHost1?.Id;
                    }
                    else if (domPlan != null && price.PlanId == domPlan.Id && price.PromotionId == null)
                    {
                        price.PromotionId = promoDom1?.Id;
                    }
                    else if (sslPlan != null && price.PlanId == sslPlan.Id && price.PromotionId == null)
                    {
                        price.PromotionId = promoSsl1?.Id;
                    }
                    else if (emailPlan != null && price.PlanId == emailPlan.Id && price.PromotionId == null)
                    {
                        price.PromotionId = price.BillingCycle == "Năm" ? promoEmail2?.Id : promoEmail1?.Id;
                    }
                }
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
