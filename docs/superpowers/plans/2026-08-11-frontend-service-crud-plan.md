# Frontend Service CRUD & Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng giao diện Frontend hoàn chỉnh quản lý Danh mục, Gói cước và Bảng giá/Khuyến mãi (Task 4.5) trên nền tảng Next.js 16 + Tailwind CSS 4.

**Architecture:** Thiết lập tệp Layout lồng (`app/admin/layout.tsx`) để quản trị phiên làm việc JWT tập trung và Sidebar điều hướng. Triển khai các trang quản trị độc lập tương tác trực tiếp với API backend thông qua thư viện client `api Fetch` an toàn.

**Tech Stack:** Next.js 16 (App Router), React, Tailwind CSS 4, Lucide Icons (nếu có, hoặc dùng Emoji/SVG đơn giản).

## Global Constraints

*   Tất cả các tệp trang quản trị sử dụng `"use client"`.
*   Sử dụng bộ gọi API dùng chung tại `@/utils/api` (`apiFetch`, `getAccessToken`, `refreshAccessToken`).
*   Giao diện thiết kế theo hệ màu tối (#030712) và áp dụng hiệu ứng kính mờ `glassmorphism` có sẵn trong `globals.css`.
*   Giao diện hiển thị tiếng Việt trực quan, xử lý đầy đủ các trạng thái tải dữ liệu (Loading) và báo lỗi nếu API thất bại.

---

### Task 1: Thiết lập Admin Layout & Sidebar Điều Hướng

**Files:**
*   Create: `front-end/app/admin/layout.tsx`
*   Modify: `front-end/app/admin/dashboard/page.tsx`

**Interfaces:**
*   Consumes: `apiFetch`, `getAccessToken`, `refreshAccessToken` từ `utils/api`
*   Produces: Giao diện Layout quản trị bao quanh tất cả các trang `/admin/*` trừ `/admin/login`.

- [ ] **Step 1: Tạo tệp layout quản trị dùng chung**
  Tạo tệp `front-end/app/admin/layout.tsx` với logic kiểm tra đăng nhập tập trung và vẽ thanh Sidebar bên trái. Nếu đang kiểm tra phiên, hiển thị Spinner loading. Loại trừ đường dẫn `/admin/login`.
- [ ] **Step 2: Cập nhật trang Dashboard**
  Sửa `front-end/app/admin/dashboard/page.tsx` để xóa bỏ logic kiểm tra token nội bộ (vì layout đã xử lý). Giữ lại nội dung dashboard sạch sẽ.
- [ ] **Step 3: Biên dịch kiểm tra**
  Chạy build dự án Next.js cục bộ:
  Run: `npm run build` hoặc tương đương bên trong thư mục `front-end`.
  Expected: Biên dịch PASS không lỗi TypeScript.
  Commit: `feat(admin): implement centralized layout and sidebar navigation`

---

### Task 2: Giao diện Quản lý Danh mục (`/admin/categories`)

**Files:**
*   Create: `front-end/app/admin/categories/page.tsx`

**Interfaces:**
*   Consumes: `/api/service-categories` endpoints (GET, POST, PUT, DELETE)

- [ ] **Step 1: Thiết lập trang danh sách và gọi API lấy dữ liệu**
  Tạo tệp `front-end/app/admin/categories/page.tsx`, sử dụng `apiFetch` gọi `GET /api/service-categories` để điền dữ liệu vào bảng.
- [ ] **Step 2: Thêm các Modal thêm/sửa danh mục**
  Thiết kế các state điều khiển hiển thị Modal thêm mới (gửi `POST`) và sửa danh mục (gửi `PUT`), xử lý tải dữ liệu sau khi gửi thành công.
- [ ] **Step 3: Thiết lập Modal xác nhận xóa mềm cascade**
  Nút xóa sẽ hiển thị Modal cảnh báo: *"Hành động này sẽ ẩn toàn bộ gói cước và bảng giá thuộc danh mục này!"* Khi đồng ý, gửi `DELETE /api/service-categories/{id}`.
- [ ] **Step 4: Kiểm tra biên dịch**
  Run: `npm run build`
  Expected: Build PASS.
  Commit: `feat(admin-categories): implement service category management page`

---

### Task 3: Giao diện Quản lý Gói cước (`/admin/plans`)

**Files:**
*   Create: `front-end/app/admin/plans/page.tsx`

**Interfaces:**
*   Consumes: `/api/service-plans` endpoints (GET, POST, PUT, DELETE, REGENERATE QR)

- [ ] **Step 1: Thiết lập bảng danh sách và các bộ lọc tìm kiếm**
  Tạo tệp `front-end/app/admin/plans/page.tsx`. Thiết kế ô tìm kiếm tên/mô tả, Dropdown chọn danh mục cha, Dropdown sắp xếp. Gọi `GET /api/service-plans` kèm theo các Query Parameters.
- [ ] **Step 2: Thiết kế Modal Thêm/Sửa gói cước**
  Biểu mẫu nhập thông số kỹ thuật (CPU, RAM, Storage, Bandwidth) và chọn Danh mục cha (lấy danh sách từ API `/api/service-categories`).
- [ ] **Step 3: Tích hợp mã QR và tính năng sinh lại mã QR**
  Hiển thị ảnh QR Code thu nhỏ trong bảng. Thêm nút "Regenerate" bên cạnh. Khi bấm, gửi `POST /api/service-plans/{id}/qr-code/regenerate` và tự động cập nhật lại danh sách.
- [ ] **Step 4: Kiểm tra biên dịch**
  Run: `npm run build`
  Expected: Build PASS.
  Commit: `feat(admin-plans): implement service plan management page with QR regeneration`

---

### Task 4: Giao diện Bảng giá & Khuyến mãi (`/admin/prices`)

**Files:**
*   Create: `front-end/app/admin/prices/page.tsx`

**Interfaces:**
*   Consumes: Bảng giá theo gói cước `/api/service-plan/{planId}/prices` và Khuyến mãi `/api/promotions`

- [ ] **Step 1: Thiết kế bộ chọn gói cước và bảng danh sách giá cước**
  Tạo tệp `front-end/app/admin/prices/page.tsx`. Hiển thị bộ chọn Gói cước ở đầu trang. Khi chọn gói, gọi API lấy danh sách bảng giá tương ứng.
- [ ] **Step 2: Thêm các chức năng CRUD cho bảng giá**
  Thêm các nút Thêm, Sửa, Xóa bảng giá (Billing Cycle, Price, PromotionId).
- [ ] **Step 3: Thiết kế biểu mẫu quản lý chương trình khuyến mãi**
  Thiết lập khu vực quản lý danh sách chương trình khuyến mãi và nút "Tạo khuyến mãi" (gửi `POST /api/promotions`).
- [ ] **Step 4: Chạy build toàn bộ dự án Frontend**
  Run: `npm run build`
  Expected: Build PASS hoàn toàn 100%.
  Commit: `feat(admin-prices): implement pricing and promotion management page`
