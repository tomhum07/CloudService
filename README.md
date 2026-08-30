# ☁️ CloudService - Hệ Thống Bán Dịch Vụ Điện Toán Đám Mây

> **Báo cáo Bài Tập Lớn môn Phát Triển Phần Mềm Hướng Đối Tượng (PTPMHDT - IN4211)**  
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

**CloudService** là nền tảng thương mại điện tử chuyên cung cấp và quản trị các giải pháp hạ tầng điện toán đám mây thế hệ mới (Cloud VPS, Dedicated Server, NVMe Hosting, SSL Certificate, Tên miền, Email Doanh Nghiệp, Firewall Anti-DDoS). Hệ thống được xây dựng theo tiêu chuẩn công nghiệp với kiến trúc phân tầng **Clean Architecture 4 Tầng** ở phía Backend và giao diện tối ưu trải nghiệm người dùng **Glassmorphism / Slate Dark Theme** hiện đại phía Frontend.

### ✨ Các Tính Năng Nổi Bật:
1. **Khách hàng (Client Portal)**:
   - Tra cứu bảng giá trực tiếp, tính toán chi phí linh hoạt theo chu kỳ (1 - 36 tháng).
   - Tùy biến thông số kỹ thuật động theo loại dịch vụ (Tên miền hiển thị TLD/DNS/Whois; VPS hiển thị CPU/RAM/NVMe qua `planSpecs.ts`).
   - Đặt hàng dịch vụ trực tuyến yêu cầu đăng nhập tài khoản, áp dụng danh sách nhiều mã giảm giá (`PlanPromotions`).
   - Thanh toán tự động qua mã VietQR PayOS 24/7 với cơ chế đối soát ngân hàng trong 3 giây.
   - Trang cá nhân `/my-plans` quản lý các gói cước đã mua và giữ chỗ thanh toán trong 30 phút (tự động hủy quá hạn).
   - Cổng thông tin Blog công nghệ, tin tức khuyến mãi TinyMCE và đánh giá khách hàng (Testimonials).
   - Trang đăng ký làm Đối tác tiếp thị liên kết (Affiliate Program) hoa hồng lên đến 30%.
2. **Quản trị viên (Admin Portal)**:
   - **Dashboard số liệu**: 4 thẻ KPI tổng quan, biểu đồ cột SVG doanh thu theo tháng, thống kê gói cước phổ biến.
   - **Quản lý Dịch vụ & Gói cước**: CRUD Danh mục, Gói cước cấu hình đa hình, Bảng giá chu kỳ và tự động sinh mã QR.
   - **Quản lý Đơn hàng & CTV**: Phê duyệt hoặc từ chối đơn đặt mua và hồ sơ CTV; Tự động đồng bộ Realtime SignalR.
   - **Quản lý Tin tức / Blog**: Soạn thảo bài viết Rich Text với TinyMCE, tải ảnh lên Supabase Storage CDN.
   - **Quản lý Nhân sự & Phân quyền**: Quản lý tài khoản RBAC (Admin/Editor/Customer), khóa tài khoản, reset mật khẩu.
   - **Xuất báo cáo**: Kết xuất danh sách đơn hàng ra file Excel `.xlsx` chuyên nghiệp (ClosedXML) và CSV UTF-8 BOM.
   - **Nhật ký hệ thống (Audit Logs)**: Ghi vết toàn bộ hành vi quản trị viên và truy cập an ninh.
3. **Thời gian thực (Real-time Sync)**:
   - WebSocket SignalR `DataSyncHub` tự động đồng bộ thay đổi giá và khuyến mãi tới trình duyệt khách hàng tức thì không cần F5.

---

## 🏛️ 2. Kiến Trúc Hệ Thống

Dự án áp dụng nguyên lý thiết kế **Domain-Driven Design (DDD)** kết hợp **Clean Architecture 4 Tầng**:

```
BTL_PTPMHDT/
├── Back-End/
│   ├── CloudService.Domain/           # Entities (11 Bảng), Enums, BaseEntity, Value Objects
│   ├── CloudService.Application/      # DTOs, Business Interfaces, Service Contracts, Mappers
│   ├── CloudService.Infrastructure/   # DbContext, Repositories, UnitOfWork, PayOS, ClosedXML, BCrypt
│   ├── CloudService.WebApi/           # Controllers, JWT Middleware, SignalR Hubs, Swagger, Program.cs
│   └── CloudService.UnitTests/        # 102 Unit Tests (xUnit + Moq + FluentAssertions - 100% Pass)
├── front-end/                         # Next.js 16 (App Router) + Tailwind CSS v4 (25 Routes)
│   ├── app/
│   │   ├── (public)/                  # Landing page, Pricing, Services, News, Order, My-plans, Affiliate
│   │   └── admin/                     # Dashboard, Categories, Plans, Prices, News, Users, Orders, Audit Logs
│   ├── components/                    # Header, Footer, Hero, PlanCard, Testimonials, UI Glassmorphism
│   ├── services/                      # dataSyncService.ts (SignalR Client WebSocket)
│   └── utils/                         # apiFetch, JWT Silent Refresh, planSpecs.ts
├── In_Out/                            # Báo cáo học thuật Word/PDF 20 trang, ERD.md, Chi_Tiet.md
└── docker-compose.yml                 # Khởi chạy cụm PostgreSQL 15 + Web API
```

---

## 🔐 3. Tài Khoản Trải Nghiệm Mẫu

Hệ thống đã tự động cấu hình sẵn dữ liệu mẫu (Seed Data) khi khởi động:

| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`Admin@123456`** hoặc **`123123`** | **Admin** | Toàn quyền quản trị hệ thống, quản lý tài khoản, dịch vụ, xuất báo cáo |
| **`editor`** | **`Editor@123456`** hoặc **`123123`** | **Editor** | Biên tập bài viết tin tức, quản lý đơn hàng |
| **`customer`** | **`Customer@123456`** | **Customer** | Khách hàng thành viên trải nghiệm dịch vụ & `/my-plans` |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Chạy Tự Động Với Docker Compose (Khuyên dùng)

Yêu cầu máy tính đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop).

```bash
# 1. Clone repository về máy
git clone https://github.com/tomhum07/CloudService.git
cd CloudService

# 2. Khởi chạy toàn bộ hệ thống
docker compose up -d --build
```

- **Frontend Website**: `http://localhost:3000`
- **Backend API & Swagger**: `http://localhost:5074/swagger`

---

### Cách 2: Chạy Thủ Công Từng Phân Hệ (Development Mode)

#### 1. Yêu cầu môi trường:
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js v20+](https://nodejs.org/) & pnpm / npm

#### 2. Khởi chạy Backend Web API:
```bash
cd Back-End/CloudService.WebApi
dotnet run
```
> Backend sẽ lắng nghe tại: `http://localhost:5074` (Tài liệu Swagger OpenAPI tại `http://localhost:5074/swagger`).

#### 3. Khởi chạy Frontend Next.js:
```bash
cd front-end
pnpm install
pnpm run dev
```
> Frontend sẽ mở tại: `http://localhost:3000`.

---

## 🧪 5. Kiểm Thử Hệ Thống (Unit Testing & Code Coverage)

Bộ kiểm thử tự động toàn diện bao gồm **102 bài test** (xUnit + Moq + FluentAssertions) kiểm tra toàn bộ các tầng nghiệp vụ: Khởi tạo Entity, DTOs Validation, Xác thực JWT, Mã hóa mật khẩu BCrypt, CRUD dịch vụ, Tính toán giá & Đa khuyến mãi, Tự động hủy đơn quá hạn 30 phút, Thống kê Dashboard và Export dữ liệu.

```bash
# Chạy toàn bộ 102 ca Unit Tests:
dotnet test Back-End/CloudService.UnitTests/CloudService.UnitTests.csproj
```

**Kết quả kiểm thử thực tế:**
```text
Test run for Back-End/CloudService.UnitTests/bin/Debug/net10.0/CloudService.UnitTests.dll (.NETCoreApp,Version=v10.0)
A total of 1 test files matched the specified pattern.

Passed!  - Failed:     0, Passed:   102, Skipped:     0, Total:   102, Duration: 9 s - CloudService.UnitTests.dll (net10.0)
```

### Bảng Phân Bổ 102 Test Cases Theo Phân Tầng:
| Phân hệ kiểm thử (Test Suite) | Số ca Test | Trạng thái | Độ bao phủ (Coverage) |
| :--- | :---: | :---: | :---: |
| **`EntityTests`** (Domain Entities & Ràng buộc) | 12 Tests | **12/12 PASS** | 94.4% |
| **`DtoTests` & `ServiceDtosTests`** (Application DTOs) | 23 Tests | **23/23 PASS** | 85.0% |
| **`AuthServiceTests`** (JWT, BCrypt Hash, RBAC Roles, Reset OTP) | 18 Tests | **18/18 PASS** | 78.0% |
| **`PlanPriceServiceTests`** (Bảng giá, Đa Khuyến mãi PlanPromotions) | 15 Tests | **15/15 PASS** | 88.6% |
| **`ServicePlanServiceTests`** (Gói cước, Soft Delete, QR Code) | 9 Tests | **9/9 PASS** | 75.2% |
| **`ServiceCategoryServiceTests`** (Danh mục dịch vụ, Slug) | 8 Tests | **8/8 PASS** | 82.0% |
| **`StatisticsServiceTests`** (Thống kê KPI, Biểu đồ Dashboard) | 5 Tests | **5/5 PASS** | 91.3% |
| **`OrderRequestServiceTests`** (Tạo đơn, Hủy đơn 30p, ClosedXML Excel) | 6 Tests | **6/6 PASS** | 63.7% |
| **`ApplicationDbContextTests`** (EF Core Model, Filters, Index) | 6 Tests | **6/6 PASS** | 98.2% |
| **TỔNG CỘNG HỆ THỐNG** | **102 Tests** | **102/102 PASS (100%)** | **Trung bình 82.5%** |

---

## 👥 6. Phân Công Thành Viên & Đánh Giá Đóng Góp

| Thành viên | Vai trò | Hạng mục công việc chính | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Võ Nguyễn Nguyên Hùng** *(Trưởng nhóm)* | **Architecture & Full-Stack Lead** | - Phụ trách toàn diện kiến trúc Clean Architecture 4 tầng & CSDL PostgreSQL 11 bảng chuẩn 3NF.<br/>- Xây dựng lõi xác thực JWT/RBAC, toàn bộ Core API, Cổng VietQR PayOS 24/7, Realtime SignalR, Dashboard, Xuất Excel.<br/>- Xây dựng toàn bộ Frontend Next.js 16 (25 routes, Dark Glassmorphism, Admin Portal).<br/>- Viết 102/102 ca Unit Tests, thiết lập Docker & Pipeline CI/CD GitHub Actions.<br/>- Biên soạn Báo cáo học thuật. | **100% (Xuất sắc)** |
| **Hồ Nguyễn Đức Anh Hào** | **CMS & Testimonials** | - Xây dựng phân hệ Đánh giá Khách hàng (Testimonials: Entity, DTOs, Service, Controller, Migration).<br/>- Xây dựng các DTOs Phân hệ Tin tức & Hỗ trợ Soft-delete. | **100% (Tốt)** |
| **Huỳnh Nhật Duy ** |  |  | **0%** |
| **Hà Thanh Tồn** |  |  | **0%** |

---

## 📄 7. Giấy Phép & Đóng Góp
Dự án được xây dựng phục vụ mục đích học tập và nghiên cứu môn **Phát Triển Phần Mềm Hướng Đối Tượng (IN4211)** tại Trường Đại học Đồng Tháp. Mọi quyền sở hữu trí tuệ thuộc về nhóm sinh viên thực hiện.
