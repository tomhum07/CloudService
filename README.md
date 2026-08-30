# ☁️ CloudService - Nền Tảng Dịch Vụ Điện Toán Đám Mây

> **Báo cáo Bài Tập Lớn môn Phát Triển Phần Mềm Hướng Đối Tượng (IN4211) — Trường Đại học Đồng Tháp**

[![.NET 10](https://img.shields.io/badge/.NET-10.0%20LTS-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-Passed-brightgreen?logo=githubactions&logoColor=white)](https://github.com/tomhum07/CloudService/actions)
[![Tests](https://img.shields.io/badge/Unit%20Tests-102%20Passed%20(100%25)-brightgreen)](https://github.com/tomhum07/CloudService)

---

## 📖 1. Giới Thiệu
**CloudService** là hệ thống thương mại điện tử cung cấp dịch vụ Cloud VPS, Hosting, Domain, SSL, Email Doanh Nghiệp theo chuẩn **Clean Architecture 4 Tầng** (.NET 10 Web API) và Frontend **Next.js 16 App Router** (Dark Glassmorphism).

* **Khách hàng**: Tra cứu giá, tùy biến thông số kỹ thuật động, áp nhiều mã giảm giá (`PlanPromotions`), thanh toán tự động VietQR PayOS (3s), trang `/my-plans` giữ chỗ 30 phút.
* **Quản trị viên**: Dashboard KPI & Biểu đồ SVG, CRUD Danh mục/Gói cước/Bảng giá (sinh mã QR), Duyệt đơn & CTV Affiliate, Soạn thảo tin tức TinyMCE, Phân quyền RBAC, Xuất Excel/CSV, Audit Logs.
* **Realtime**: WebSocket SignalR `DataSyncHub` đồng bộ dữ liệu hai chiều tức thời.

---

## 🏛️ 2. Cấu Trúc Dự Án
```
BTL_PTPMHDT/
├── Back-End/
│   ├── CloudService.Domain/           # 11 Entities, BaseEntity (Soft delete), Enums
│   ├── CloudService.Application/      # Interfaces, DTOs, Service Contracts
│   ├── CloudService.Infrastructure/   # DbContext (PostgreSQL 15 Supabase), PayOS, ClosedXML
│   ├── CloudService.WebApi/           # Controllers, JWT, SignalR DataSyncHub, Swagger
│   └── CloudService.UnitTests/        # 102 Unit Tests (xUnit + Moq - 100% Pass)
├── front-end/                         # Next.js 16 App Router (25 Routes)
└── docker-compose.yml                 # Khởi chạy PostgreSQL 15 + Web API
```

---

## 🔐 3. Tài Khoản Mẫu
| Tài khoản (Username) | Mật khẩu (Password) | Vai trò (Role) |
| :--- | :--- | :--- |
| **`admin`** | **`Admin@123456`** hoặc **`123123`** | **Admin** (Toàn quyền quản trị) |
| **`editor`** | **`Editor@123456`** hoặc **`123123`** | **Editor** (Biên tập tin tức & đơn hàng) |
| **`customer`** | **`Customer@123456`** | **Customer** (Khách hàng & `/my-plans`) |

---

## 🚀 4. Khởi Chạy Nhanh

### Chạy bằng Docker Compose (Khuyên dùng):
```bash
docker compose up -d --build
```
* **Frontend**: `http://localhost:3000` | **Backend API**: `http://localhost:5074/swagger`

### Chạy Thủ Công:
```bash
# Backend:
cd Back-End/CloudService.WebApi && dotnet run

# Frontend:
cd front-end && pnpm install && pnpm run dev
```

---

## 🧪 5. Kiểm Thử Hệ Thống (102 Unit Tests - 100% Pass)

```bash
dotnet test Back-End/CloudService.UnitTests/CloudService.UnitTests.csproj
```
```text
Passed!  - Failed: 0, Passed: 102, Skipped: 0, Total: 102, Duration: 9 s
```

* **102 Tests (Coverage > 82.5%)**: Bao phủ toàn diện Domain Entities (12), Application DTOs (23), AuthService JWT/RBAC (18), PlanPriceService & Đa khuyến mãi (15), ServicePlan & QR (9), Categories (8), Dashboard KPI (5), Orders & ClosedXML (6), DbContext (6).

---

## 👥 6. Phân Công Thành Viên & Đóng Góp

| Thành viên | Vai trò | Hạng mục công việc chính | Đánh giá |
| :--- | :--- | :--- | :---: |
| **Member 1** *(Trưởng nhóm)* | **Architecture & Full-Stack Lead** | - **Phụ trách toàn diện và hoàn thiện toàn bộ hệ thống từ đầu đến cuối**.<br/>- Thiết kế kiến trúc Clean Architecture 4 tầng & CSDL PostgreSQL Supabase 11 bảng chuẩn 3NF.<br/>- Xác thực JWT, Cookie HttpOnly Silent Refresh, BCrypt, phân quyền RBAC.<br/>- CRUD Danh mục, Gói cước, Bảng giá chu kỳ, Đa mã khuyến mãi `PlanPromotions`, Sinh mã QR.<br/>- Xử lý Đơn hàng, Thanh toán VietQR PayOS 24/7, Giữ chỗ 30p & `AutoCancelExpiredOrdersAsync()`.<br/>- SignalR `DataSyncHub`, Dashboard SVG, AuditLogs, Xuất Excel/CSV.<br/>- Toàn bộ Frontend Next.js 16 (25 routes, Dark Theme, `planSpecs.ts`, `/my-plans`, `/order`, `/admin/*`).<br/>- Viết 102/102 Unit Tests, Docker Multi-stage, CI/CD GitHub Actions.<br/>- Biên soạn Báo cáo học thuật, `ERD.md`, `Chi_Tiet.md`, `README.md`. | **100% (Xuất sắc)** |
| **Member 3** | **CMS & Testimonials** | - Phân hệ Testimonials: Entity `Testimonial.cs`, DTOs, `TestimonialService`, Controller, Migration.<br/>- DTOs Tin tức: `CreateNewsArticleRequest`, `NewsArticleDto`, `PagedNewsResult`, `UpdateNewsArticleRequest`; Hỗ trợ Soft-delete. | **100% (Tốt)** |
| **Member 2** | **Analytics Support** | - Hỗ trợ thiết kế truy vấn thống kê Dashboard & kiểm thử xuất file Excel/CSV. | **100%** |
| **Member 4** | **Order & Affiliate Support** | - Hỗ trợ kiểm thử luồng đặt mua VietQR PayOS & rà soát giao diện CTV Affiliate. | **100%** |

---

## 📄 7. Bản Quyền
Dự án phục vụ học tập và nghiên cứu môn **Phát Triển Phần Mềm Hướng Đối Tượng (IN4211)**.
