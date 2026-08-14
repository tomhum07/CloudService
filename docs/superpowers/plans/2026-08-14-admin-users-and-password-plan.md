# Implementation Plan: Quản Lý Tài Khoản & Đổi Mật Khẩu

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai tính năng Quản lý Tài khoản (CRUD) dành cho Admin và tính năng Đổi mật khẩu của người dùng quản trị.

---

### Task 1: Định Nghĩa DTOs & Interfaces (Tầng Application)

**Files:**
*   Create: `Back-End/CloudService.Application/DTOs/Auth/ChangePasswordRequest.cs`
*   Create: `Back-End/CloudService.Application/DTOs/Auth/AdminResetPasswordRequest.cs`
*   Create: `Back-End/CloudService.Application/DTOs/Auth/UserDto.cs`
*   Create: `Back-End/CloudService.Application/DTOs/Auth/UpdateUserRequest.cs`
*   Modify: `Back-End/CloudService.Application/Interfaces/IAuthService.cs`

- [ ] **Step 1: Tạo các tệp tin DTOs**
  Tạo 4 tệp tin DTOs mới trong thư mục `Back-End/CloudService.Application/DTOs/Auth/` để truyền dữ liệu.
- [ ] **Step 2: Cập nhật hợp đồng IAuthService**
  Khai báo thêm 5 phương thức: `GetAllUsersAsync`, `UpdateUserAsync`, `DeleteUserAsync`, `ChangePasswordAsync`, `AdminResetPasswordAsync`.
- [ ] **Step 3: Biên dịch kiểm tra**
  Run: `dotnet build Back-End/CloudService.Application`
  Expected: Biên dịch PASS không lỗi.
  Commit: `feat(auth): define DTOs and IAuthService interface extensions for account management`

---

### Task 2: Triển Khai Logic Nghiệp Vụ (Tầng Infrastructure)

**Files:**
*   Modify: `Back-End/CloudService.Infrastructure/Services/AuthService.cs`

- [ ] **Step 1: Triển khai các phương thức nghiệp vụ trong AuthService**
  *   `GetAllUsersAsync`: Truy vấn tất cả `AppUsers` kèm theo `Role`, map sang `UserDto`.
  *   `UpdateUserAsync`: Cập nhật `FullName`, `Email`, `RoleId` (tìm Role qua Name "Admin"/"Editor"), và `IsActive`.
  *   `DeleteUserAsync`: Soft-delete (gán `IsActive = false`).
  *   `ChangePasswordAsync`: Xác minh mật khẩu cũ bằng `BCrypt.Net.BCrypt.Verify`, băm mật khẩu mới bằng `BCrypt.Net.BCrypt.HashPassword` và lưu lại.
  *   `AdminResetPasswordAsync`: Băm trực tiếp mật khẩu mới và lưu lại.
- [ ] **Step 2: Biên dịch kiểm tra**
  Run: `dotnet build Back-End/CloudService.Infrastructure`
  Expected: Biên dịch PASS không lỗi.
  Commit: `feat(auth): implement AuthService methods for user CRUD and password changes`

---

### Task 3: Triển Khai API Endpoints (Tầng WebApi)

**Files:**
*   Modify: `Back-End/CloudService.WebApi/Controllers/AdminUsersController.cs`
*   Modify: `Back-End/CloudService.WebApi/Controllers/AuthController.cs`

- [ ] **Step 1: Bổ sung các Endpoint trong AdminUsersController**
  *   `GET /api/admin/users`: Trả về danh sách người dùng.
  *   `PUT /api/admin/users/{id}`: Cập nhật tài khoản.
  *   `DELETE /api/admin/users/{id}`: Vô hiệu hóa tài khoản.
  *   `POST /api/admin/users/{id}/reset-password`: Reset mật khẩu cho nhân viên.
  - Đảm bảo toàn bộ Controller này được cấu hình quyền hạn `[Authorize(Roles = "Admin")]`.
- [ ] **Step 2: Bổ sung Endpoint trong AuthController**
  *   `POST /api/auth/change-password`: Đổi mật khẩu cá nhân (Sử dụng `[Authorize]` và lấy tên người dùng từ `User.Identity?.Name`).
- [ ] **Step 3: Biên dịch kiểm tra**
  Run: `dotnet build Back-End/CloudService.WebApi`
  Expected: Biên dịch PASS không lỗi.
  Commit: `feat(auth-api): implement API endpoints for account CRUD and password reset`

---

### Task 4: Kiểm Thử Backend (Unit Tests)

**Files:**
*   Create/Modify: `Back-End/CloudService.UnitTests/Application/Services/AuthServiceTests.cs`

- [ ] **Step 1: Viết Unit Tests kiểm thử nghiệp vụ mới**
  *   Test lấy danh sách, sửa thông tin, khóa tài khoản.
  *   Test đổi mật khẩu cá nhân thành công/thất bại (do sai mật khẩu cũ).
  *   Test Admin reset mật khẩu.
- [ ] **Step 2: Chạy kiểm thử tự động**
  Run: `dotnet test Back-End/CloudService.UnitTests --filter "FullyQualifiedName~AuthService"`
  Expected: Tất cả các test đều PASS 100%.
  Commit: `test(auth): add unit tests for user management and password operations`

---

### Task 5: Cập Nhật Sidebar Layout & Tự Động Phân Quyền (Frontend Layout)

**Files:**
*   Modify: `front-end/app/admin/layout.tsx`

- [ ] **Step 1: Tích hợp giải mã JWT Token ngoài Frontend**
  Định nghĩa hàm giải mã JWT Token đơn giản trong layout (`atob`) để lấy `role` của người dùng quản trị từ token đang có trong RAM.
- [ ] **Step 2: Cập nhật Sidebar Menu**
  *   Bổ sung menu "Quản lý Tài khoản" (`/admin/users`) chỉ hiển thị khi `role === "Admin"`.
  *   Bổ sung menu "Đổi mật khẩu" (`/admin/change-password`) cho tất cả người dùng quản trị.
- [ ] **Step 3: Biên dịch kiểm tra**
  Run: `pnpm build` trong thư mục `front-end`.
  Expected: Build PASS không lỗi.
  Commit: `feat(admin-layout): update sidebar navigation with user role authorization`

---

### Task 6: Giao Diện Quản Lý Tài Khoản & Đổi Mật Khẩu (Frontend Pages)

**Files:**
*   Create: `front-end/app/admin/users/page.tsx`
*   Create: `front-end/app/admin/change-password/page.tsx`

- [ ] **Step 1: Thiết kế trang Quản lý Tài khoản (`/admin/users/page.tsx`)**
  *   Bảng hiển thị danh sách người dùng (Tên, Email, Quyền hạn, Trạng thái, Ngày tạo).
  *   Modal "Thêm tài khoản" gọi `POST /api/admin/users`.
  *   Modal "Sửa tài khoản" gọi `PUT /api/admin/users/{id}`.
  *   Modal "Khóa tài khoản" gọi `DELETE /api/admin/users/{id}`.
  *   Modal "Reset mật khẩu" gọi `POST /api/admin/users/{id}/reset-password`.
- [ ] **Step 2: Thiết kế trang Đổi mật khẩu cá nhân (`/admin/change-password/page.tsx`)**
  *   Form điền Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu mới.
  *   Gọi API `POST /api/auth/change-password` và hiển thị thông báo thành công.
- [ ] **Step 3: Biên dịch kiểm tra toàn diện**
  Run: `pnpm build` trong thư mục `front-end`.
  Expected: Toàn bộ dự án Frontend build thành công.
  Commit: `feat(admin-users): implement user management and change password pages`
