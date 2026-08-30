# ☁️ CloudService - Nền Tảng Dịch Vụ Điện Toán Đám Mây

> **Báo cáo Bài Tập Lớn môn Phát Triển Phần Mềm Hướng Đối Tượng (IN4211)**  
> Trường Đại học Đồng Tháp (DTHU) — Khoa Công nghệ & Kỹ thuật

[![.NET 10](https://img.shields.io/badge/.NET-10.0%20LTS-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%20Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS-v4.0%20Dark-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage%20Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-3%20Jobs%20Passed-brightgreen?logo=githubactions&logoColor=white)](https://github.com/tomhum07/CloudService/actions)
[![Tests](https://img.shields.io/badge/Unit%20Tests-102%20Passed%20(100%25)-brightgreen)](https://github.com/tomhum07/CloudService)

---

## 📖 1. Giới Thiệu Dự Án

**CloudService** là nền tảng thương mại điện tử cung cấp các giải pháp hạ tầng điện toán đám mây (Cloud VPS, Web Hosting, Domain, SSL, Business Email, Firewall Anti-DDoS). Hệ thống được xây dựng theo chuẩn **Clean Architecture 4 Tầng** (.NET 10 Web API) và Frontend **Next.js 16 App Router** (Dark Glassmorphism).

### ✨ Tính Năng Nổi Bật:
* **Khách hàng**: Tra cứu bảng giá chu kỳ, tùy biến thông số kỹ thuật động theo dịch vụ (`planSpecs.ts`), đặt hàng bắt buộc đăng nhập, áp dụng nhiều mã giảm giá (`PlanPromotions`), thanh toán tự động VietQR PayOS 24/7 (đối soát 3s), trang `/my-plans` giữ chỗ 30 phút.
* **Quản trị viên**: Dashboard KPI & Biểu đồ doanh thu SVG, CRUD Danh mục & Gói cước (sinh mã QR động), Bảng giá & Khuyến mãi, Quản lý Đơn hàng & Duyệt CTV Affiliate, Soạn thảo tin tức TinyMCE, Phân quyền RBAC (Admin/Editor/Customer), Xuất file Excel ClosedXML / CSV, Nhật ký Audit Logs.
* **Thời gian thực**: WebSocket SignalR `DataSyncHub` tự động đồng bộ dữ liệu hai chiều tức thì.

---

## 🏛️ 2. Kiến Trúc Clean Architecture 4 Tầng

```
BTL_PTPMHDT/
├── Back-End/
│   ├── CloudService.Domain/           # 11 Entities, BaseEntity (Soft delete), Enums
│   ├── CloudService.Application/      # Interfaces, DTOs, Service Contracts, Mappers
│   ├── CloudService.Infrastructure/   # DbContext (PostgreSQL 15 Supabase), Repositories, PayOS, ClosedXML
│   ├── CloudService.WebApi/           # Controllers, JWT Middleware, SignalR DataSyncHub, Swagger
│   └── CloudService.UnitTests/        # 102 Unit Tests (xUnit + Moq - 100% Pass)
├── front-end/                         # Next.js 16 App Router + Tailwind CSS v4 (25 Routes)
└── docker-compose.yml                 # Khởi chạy cụm PostgreSQL 15 + Web API
```

---

## 🔐 3. Tài Khoản Trải Nghiệm Mẫu

| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`Admin@123456`** hoặc **`123123`** | **Admin** | Toàn quyền quản trị hệ thống, tài khoản, dịch vụ, xuất báo cáo |
| **`editor`** | **`Editor@123456`** hoặc **`123123`** | **Editor** | Biên tập bài viết tin tức, quản lý đơn hàng |
| **`customer`** | **`Customer@123456`** | **Customer** | Khách hàng thành viên trải nghiệm dịch vụ & `/my-plans` |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng)
```bash
docker compose up -d --build
```
* **Frontend Web**: `http://localhost:3000`
* **Backend API & Swagger**: `http://localhost:5074/swagger`

### Cách 2: Chạy Thủ Công (Development Mode)
```bash
# Terminal 1 - Backend API:
cd Back-End/CloudService.WebApi && dotnet run

# Terminal 2 - Frontend Next.js:
cd front-end && pnpm install && pnpm run dev
```

---

## 🧪 5. Kiểm Thử Hệ Thống (Unit Testing)

Hệ thống sở hữu bộ kiểm thử tự động toàn diện gồm **102 ca Unit Tests** (xUnit + Moq + FluentAssertions) đạt tỷ lệ **100% PASS** (thời gian chạy 9s, độ bao phủ code > 82.5%):

```bash
dotnet test Back-End/CloudService.UnitTests/CloudService.UnitTests.csproj
```

```text
Passed!  - Failed: 0, Passed: 102, Skipped: 0, Total: 102, Duration: 9 s
```

| Phân hệ kiểm thử | Số ca Test | Trạng thái | Nội dung kiểm thử chính |
| :--- | :---: | :---: | :--- |
| `EntityTests` | 12 Tests | **PASS** | Kiểm tra ràng buộc và khởi tạo 11 Domain Entities. |
| `DtoTests` & `ServiceDtosTests` | 23 Tests | **PASS** | Kiểm tra tính hợp lệ dữ liệu DTOs. |
| `AuthServiceTests` | 18 Tests | **PASS** | Xác thực JWT, Hash BCrypt, Phân quyền RBAC, Reset OTP. |
| `PlanPriceServiceTests` | 15 Tests | **PASS** | Tính toán bảng giá, gán đa khuyến mãi `PlanPromotions`. |
| `ServicePlanServiceTests` | 9 Tests | **PASS** | CRUD gói cước, Soft delete, Sinh mã QR Code. |
| `ServiceCategoryServiceTests` | 8 Tests | **PASS** | CRUD danh mục dịch vụ, tự động sinh Slug URL. |
| `StatisticsServiceTests` | 5 Tests | **PASS** | Tính toán KPI doanh thu, thống kê Dashboard. |
| `OrderRequestServiceTests` | 6 Tests | **PASS** | Tạo đơn, Hủy đơn quá hạn 30p, Xuất Excel ClosedXML. |
| `ApplicationDbContextTests` | 6 Tests | **PASS** | Cấu hình EF Core, Global Query Filters, B-Tree Index. |

---

## 👥 6. Phân Công Thành Viên & Đánh Giá Đóng Góp

| Thành viên | Vai trò | Hạng mục công việc chính phụ trách | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Nguyễn Duy Tường** *(Trưởng nhóm)* | **Architecture, Full-Stack Lead & DevOps** | **Phụ trách toàn diện và hoàn thiện toàn bộ hệ thống:**<br/>- Thiết kế kiến trúc Clean Architecture 4 tầng (.NET 10 Web API);<br/>- Thiết kế CSDL PostgreSQL Supabase 11 bảng chuẩn 3NF, Migration & Seed Data;<br/>- Lõi xác thực JWT, Cookie HttpOnly Silent Refresh, BCrypt, phân quyền RBAC;<br/>- Core Catalog: Danh mục (`ServiceCategories`), Gói cước (`ServicePlans`), Bảng giá (`PlanPrices`), Sinh mã QR động;<br/>- Quản lý đa mã giảm giá (`PlanPromotions` N-N);<br/>- Quy trình Đơn hàng (`OrderRequests`), Tích hợp thanh toán VietQR PayOS 24/7, Giữ chỗ 30 phút & `AutoCancelExpiredOrdersAsync()`;<br/>- Kênh đồng bộ thời gian thực SignalR `DataSyncHub` hai chiều;<br/>- Dashboard KPI, Biểu đồ SVG, Nhật ký `AuditLogs`, Xuất Excel (`ClosedXML`) và CSV UTF-8;<br/>- Toàn bộ Frontend Next.js 16 (25 routes, Dark Glassmorphism, `planSpecs.ts`, `/my-plans`, `/order`, `/admin/*`);<br/>- Viết 102/102 ca Unit Tests (xUnit, Moq); Docker & CI/CD GitHub Actions (3 Jobs Xanh);<br/>- Biên soạn Báo cáo học thuật Word/PDF 20 trang, `ERD.md`, `Chi_Tiet.md`. | **100% (Xuất sắc)** |
| **Thành viên 3** *(Nhánh `feature/member3-news-blog`)* | **CMS & Testimonials Module** | - **Phân hệ Đánh giá Khách hàng (Testimonials)**: Entity `Testimonial.cs`, DTOs, Interface `ITestimonialService`, `TestimonialService.cs`, `TestimonialsController.cs`, Migration `AddTestimonials`.<br/>- **DTOs Phân hệ Tin tức / Blog**: `CreateNewsArticleRequest.cs`, `NewsArticleDto.cs`, `PagedNewsResult.cs`, `UpdateNewsArticleRequest.cs`; Hỗ trợ Soft-delete tin tức. | **100% (Tốt)** |
| **Thành viên 2** | **Analytics Support** | - Hỗ trợ thiết kế truy vấn thống kê Dashboard & kiểm thử xuất file Excel/CSV. | **100%** |
| **Thành viên 4** | **Order & Affiliate Support** | - Hỗ trợ kiểm thử luồng đặt mua VietQR PayOS & rà soát giao diện CTV Affiliate. | **100%** |

---

## 📄 7. Giấy Phép & Bản Quyền
Dự án phục vụ học tập và nghiên cứu môn **Phát Triển Phần Mềm Hướng Đối Tượng (IN4211)** tại Trường Đại học Đồng Tháp. Mọi quyền sở hữu trí tuệ thuộc về nhóm sinh viên thực hiện.
