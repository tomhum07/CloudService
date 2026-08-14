# Design Specification: Quản Lý Tài Khoản & Đổi Mật Khẩu Admin Portal

Đặc tả thiết kế chi tiết cho chức năng Quản lý Tài khoản nhân sự (CRUD) và Đổi mật khẩu của người dùng quản trị trong Admin Portal (cả Backend và Frontend).

---

## 1. Đặc tả API Backend (ASP.NET Core Web API)

### 1.1. Các DTOs mới (`CloudService.Application/DTOs/Auth/`)
*   **`UserDto`**: Dữ liệu phản hồi của thông tin người dùng.
    *   `int Id`, `string Username`, `string FullName`, `string Email`, `string Role`, `bool IsActive`, `DateTime CreatedAt`
*   **`UpdateUserRequest`**: Dữ liệu gửi lên khi sửa tài khoản nhân viên.
    *   `string FullName`, `string Email`, `string Role`, `bool IsActive`
*   **`ChangePasswordRequest`**: Dữ liệu người dùng gửi lên khi tự đổi mật khẩu.
    *   `string OldPassword`, `string NewPassword`
*   **`AdminResetPasswordRequest`**: Dữ liệu Admin gửi lên khi khôi phục mật khẩu cho nhân viên.
    *   `string NewPassword`

### 1.2. Mở rộng `IAuthService` và `AuthService`
*   `Task<IEnumerable<UserDto>> GetAllUsersAsync();`
*   `Task<bool> UpdateUserAsync(int id, UpdateUserRequest request);`
*   `Task<bool> DeleteUserAsync(int id);` (Soft delete tài khoản bằng cách gán `IsActive = false`)
*   `Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request);` (Yêu cầu xác thực mật khẩu cũ bằng BCrypt)
*   `Task<bool> AdminResetPasswordAsync(int id, string newPassword);` (Đặt lại mật khẩu trực tiếp)

### 1.3. Controller API Endpoints
*   **`AdminUsersController`** (`[Authorize(Roles = "Admin")]`):
    *   `GET /api/admin/users`: Trả về danh sách tất cả người dùng hệ thống (`UserDto`).
    *   `POST /api/admin/users`: Tạo tài khoản quản trị/biên tập viên mới (đã có).
    *   `PUT /api/admin/users/{id}`: Cập nhật thông tin tài khoản (`UpdateUserRequest`).
    *   `DELETE /api/admin/users/{id}`: Vô hiệu hóa tài khoản (Soft delete).
    *   `POST /api/admin/users/{id}/reset-password`: Đặt lại mật khẩu cho tài khoản chỉ định (`AdminResetPasswordRequest`).
*   **`AuthController`** (`[Authorize]`):
    *   `POST /api/auth/change-password`: Đổi mật khẩu tài khoản cá nhân đang đăng nhập (`ChangePasswordRequest`).

---

## 2. Đặc tả Frontend Next.js

### 2.1. Cập nhật Sidebar Layout (`app/admin/layout.tsx`)
Bổ sung thêm 2 menu điều hướng vào danh sách `navLinks`:
*   👤 **Quản lý Tài khoản** (`/admin/users`) - chỉ hiển thị đối với tài khoản có quyền `Admin`.
*   🔑 **Đổi mật khẩu** (`/admin/change-password`) - hiển thị cho mọi người dùng đã đăng nhập (Admin & Editor).

### 2.2. Trang Quản lý Tài khoản (`app/admin/users/page.tsx`)
*   Chỉ hiển thị cho người có role `Admin`.
*   Bảng danh sách tài khoản quản trị viên và biên tập viên.
*   Nút **"Thêm tài khoản"** mở Modal Form đăng ký.
*   Nút **"Sửa"** cho phép đổi Tên hiển thị, Email, Quyền (Admin/Editor) và trạng thái Hoạt động.
*   Nút **"Khóa"** (Delete) để đưa trạng thái `IsActive` về `false`.
*   Nút **"Reset Mật khẩu"**: Mở Modal nhập mật khẩu mới để Admin ghi đè mật khẩu cho nhân viên.

### 2.3. Trang Đổi mật khẩu cá nhân (`app/admin/change-password/page.tsx`)
*   Form nhập: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.
*   Gọi API `/api/auth/change-password` để cập nhật mật khẩu riêng của tài khoản đang đăng nhập.
