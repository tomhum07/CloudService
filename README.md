# ☁️ CloudService - Hệ Thống Bán Dịch Vụ Điện Toán Đám Mây

> **Báo cáo Bài Tập Lớn môn Phát Triển Phần Mềm Hướng Đối Tượng (PTPMHDT)**  
> Trường Đại học Giao Thông Vận Tải (UTC)

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-89%20Passed-brightgreen)](https://github.com/)

---

## 📖 1. Giới Thiệu Dự Án

**CloudService** là nền tảng thương mại điện tử chuyên cung cấp và quản trị các giải pháp hạ tầng điện toán đám mây thế hệ mới (Cloud VPS, Dedicated Server, NVMe Hosting, SSL Certificate, Tên miền). Hệ thống được xây dựng theo tiêu chuẩn công nghiệp với kiến trúc phân tầng **Clean Architecture** ở phía Backend và giao diện tối ưu trải nghiệm người dùng **Glassmorphism / Neon Dark Theme** hiện đại phía Frontend.

### ✨ Các Tính Năng Nổi Bật:
1. **Khách hàng (Client Portal)**:
   - Tra cứu bảng giá trực tiếp, tính toán chi phí linh hoạt theo chu kỳ (1 tháng, 3 tháng, 6 tháng, 12 tháng).
   - Đặt hàng dịch vụ trực tuyến, chọn hệ điều hành, áp mã giảm giá và nhận mã QR thanh toán tức thời.
   - Cổng thông tin Blog, kiến thức hạ tầng, tin tức khuyến mãi và đánh giá khách hàng (Testimonials).
   - Trang đăng ký làm Đối tác tiếp thị liên kết (Affiliate Program) hoa hồng lên đến 20%.
   - Đăng ký và đăng nhập tài khoản khách hàng cá nhân.
2. **Quản trị viên (Admin Portal)**:
   - **Dashboard số liệu**: Thống kê doanh thu theo tháng, biểu đồ SVG tỷ lệ dịch vụ phổ biến, tổng quan đơn hàng.
   - **Quản lý Dịch vụ**: CRUD Danh mục, Gói cước cấu hình (CPU, RAM, SSD), Bảng giá và tự động sinh mã QR.
   - **Quản lý Đơn hàng & CTV**: Phê duyệt hoặc từ chối các yêu cầu đặt mua dịch vụ và đơn đăng ký Affiliate.
   - **Quản lý Tin tức / Blog**: Soạn thảo bài viết, tùy chỉnh danh mục, ẩn/hiện bài viết.
   - **Quản lý Nhân sự & Phân quyền**: Quản lý tài khoản Admin/Editor/Customer, khóa/mở khóa tài khoản, cấp lại mật khẩu.
   - **Xuất báo cáo**: Kết xuất toàn bộ danh sách đơn đặt hàng ra file Excel / CSV có mã hóa tiếng Việt UTF-8 BOM.
   - **Nhật ký hệ thống (Audit Logs)**: Ghi vết toàn bộ hành vi đăng nhập, thay đổi trạng thái đơn và bảo mật.

---

## 🏛️ 2. Kiến Trúc Hệ Thống

Dự án áp dụng nguyên lý thiết kế **Domain-Driven Design (DDD)** kết hợp **Clean Architecture**:

```
BTL_PTPMHDT/
├── Back-End/
│   ├── CloudService.Domain/           # Entities, Enums, BaseEntity, Domain Interfaces
│   ├── CloudService.Application/      # DTOs, Business Interfaces, Service Contracts
│   ├── CloudService.Infrastructure/   # DbContext, EF Core, Services, Migrations, BCrypt, QR Code
│   ├── CloudService.WebApi/           # Controllers, JWT Middleware, OpenAPI/Scalar, Program.cs
│   └── CloudService.UnitTests/        # 89 Unit Tests (xUnit + EF Core InMemory)
├── front-end/                         # Next.js 16 (App Router) + Tailwind CSS 4
│   ├── app/
│   │   ├── (public)/                  # Landing page, Pricing, Services, News, Order, Affiliate, Register
│   │   └── admin/                     # Dashboard, Categories, Plans, Prices, News, Users, Orders, Audit Logs
│   ├── components/                    # Header, Footer, Hero, PlanCard, Testimonials, UI Glassmorphism
│   └── utils/                         # apiFetch, JWT Silent Refresh & RAM Storage
└── docker-compose.yml                 # Docker setup cho Full-stack
```

---

## 🔐 3. Tài Khoản Trải Nghiệm Mẫu

Hệ thống đã tự động cấu hình sẵn dữ liệu mẫu (Seed Data) khi khởi động:

| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`123123`** | **Admin** | Toàn quyền quản trị hệ thống, quản lý nhân sự, dịch vụ, báo cáo |
| **`editor`** | **`123123`** | **Editor** | Biên tập bài viết tin tức, quản lý nội dung danh mục |
| **`customer`** | **`123123`** | **Customer** | Khách hàng thành viên trải nghiệm dịch vụ |

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Chạy Tự Động Với Docker Compose (Khuyên dùng)

Yêu cầu máy tính đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop).

```bash
# 1. Clone repository về máy
git clone https://github.com/tomhum07/CloudService.git
cd CloudService

# 2. Khởi chạy toàn bộ hệ thống
docker-compose up -d --build
```

- **Frontend Website**: `http://localhost:3000`
- **Backend API & Swagger**: `http://localhost:5074/scalar/v1`

---

### Cách 2: Chạy Thủ Công Từng Phân Hệ (Development Mode)

#### 1. Yêu cầu môi trường:
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js v20+](https://nodejs.org/) & npm

#### 2. Khởi chạy Backend Web API:
```bash
cd Back-End/CloudService.WebApi
dotnet run
```
> Backend sẽ lắng nghe tại: `http://localhost:5074` (Tài liệu OpenAPI Scalar tại: `http://localhost:5074/scalar/v1`).

#### 3. Khởi chạy Frontend Next.js:
```bash
cd front-end
npm install
npm run dev
```
> Frontend sẽ mở tại: `http://localhost:3000`.

---

## 🧪 5. Kiểm Thử Hệ Thống (Unit Testing)

Bộ kiểm thử bao gồm **89 bài test tự động** (xUnit) kiểm tra toàn bộ luồng xử lý xác thực JWT, mã hóa BCrypt, CRUD dịch vụ, phân quyền Admin, tính toán doanh thu Dashboard và xuất dữ liệu.

```bash
# Chạy bộ Unit Tests:
dotnet test Back-End/CloudService.UnitTests/CloudService.UnitTests.csproj
```

**Kết quả kiểm thử:**
```text
Passed!  - Failed: 0, Passed: 89, Skipped: 0, Total: 89, Duration: 3 s
```

---

## 👥 6. Phân Công Thành Viên Nhóm

| Thành viên | Nhiệm vụ chính | Tiến độ |
| :--- | :--- | :---: |
| **Member 1 (Trưởng nhóm)** | Cấu trúc kiến trúc Clean Architecture, CSDL PostgreSQL, Xác thực JWT Token & Refresh Token, CRUD Dịch vụ & Gói cước, Tự động sinh mã QR, DevOps Docker | **100%** |
| **Member 2** | Dashboard Báo cáo thống kê số liệu, Xuất danh sách đơn hàng ra file Excel / CSV, Kiểm toán hệ thống | **100%** |
| **Member 3** | Cổng Blog tin tức khuyến mãi, Biên tập nội dung RichText/Markdown, Thu thập nhận xét khách hàng (Testimonials) | **100%** |
| **Member 4** | Tiếp nhận đơn đặt hàng dịch vụ, Đăng ký đối tác tiếp thị liên kết (Affiliate), Phê duyệt đơn hàng | **100%** |

---

## 📄 7. Giấy Phép & Đóng Góp
Dự án được xây dựng phục vụ mục đích học tập và nghiên cứu môn **Phát Triển Phần Mềm Hướng Đối Tượng**. Mọi quyền sở hữu trí tuệ thuộc về nhóm sinh viên thực hiện.
