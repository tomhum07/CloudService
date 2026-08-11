# Design Specification: Frontend Service CRUD Admin Portal

Tài liệu đặc tả thiết kế chi tiết cho giao diện quản trị Danh mục dịch vụ, Gói cước và Bảng giá/Khuyến mãi (Task 4.5) trên Frontend Next.js.

---

## 1. Kiến trúc Bố cục chung (`/admin`)

Để tối ưu hóa trải nghiệm người dùng và mã nguồn, dự án sử dụng cơ chế **Nested Layout** của Next.js:

*   **Tệp Layout**: `front-end/app/admin/layout.tsx`
    *   **Loại trừ**: Nếu pathname là `/admin/login`, chỉ render `children` trực tiếp.
    *   **Xác thực tập trung**: Khi trang được tải, layout kiểm tra sự tồn tại của Access Token trong RAM thông qua `getAccessToken()`. Nếu không có, layout gọi `refreshAccessToken()` để thực hiện Silent Refresh. Nếu làm mới token thất bại, trang lập tức chuyển hướng về `/admin/login`.
    *   **Sidebar Navigation**: Cung cấp menu cố định bên trái chứa các liên kết:
        *   Dashboard: `/admin/dashboard`
        *   Danh mục dịch vụ: `/admin/categories`
        *   Gói cước dịch vụ: `/admin/plans`
        *   Giá & Khuyến mãi: `/admin/prices`
        *   Nút Đăng xuất (Logout) ở góc dưới cùng.

---

## 2. Thiết kế chi tiết các trang quản lý độc lập

### 2.1. Quản lý Danh mục (`/admin/categories`)
*   **Bảng danh sách**: Hiển thị Name, Slug, Description, Trạng thái (Kích hoạt/Ngừng hoạt động) và ngày tạo.
*   **Thao tác CRUD**:
    *   **Thêm mới**: Modal Popup chứa Form (Name, Slug, Description).
    *   **Chỉnh sửa**: Modal Popup chứa Form chỉnh sửa thông tin cũ.
    *   **Xóa mềm**: Nút xóa kích hoạt cảnh báo cascade: *"Xóa danh mục sẽ tự động đánh dấu ngừng hoạt động tất cả các gói cước và bảng giá thuộc danh mục này! Bạn có chắc muốn tiếp tục?"*

### 2.2. Quản lý Gói cước (`/admin/plans`)
*   **Bộ lọc**: Tìm kiếm theo từ khóa (Name/Description), Dropdown lọc theo Category cha, và Sắp xếp theo các tiêu chí (Tên, Giá, Ngày tạo).
*   **Bảng danh sách**: Hiển thị Tên gói, Danh mục cha, thông số kỹ thuật (CPU, RAM, Storage, Bandwidth), Mã QR (Thumbnail hình ảnh sinh từ Google Charts API), và Trạng thái.
*   **Thao tác CRUD**:
    *   **Thêm mới/Chỉnh sửa**: Form Modal chọn Danh mục cha và nhập thông số cấu hình.
    *   **Xóa mềm**: Cảnh báo cascade ẩn toàn bộ bảng giá thuộc gói cước.
    *   **Sinh lại QR Code**: Nút "Regenerate" gọi API `POST /api/service-plans/{id}/qr-code/regenerate` để cập nhật lại mã QR.

### 2.3. Quản lý Bảng giá & Khuyến mãi (`/admin/prices`)
*   **Chọn Gói cước**: Dropdown đầu trang cho phép chọn nhanh Gói cước cần cấu hình.
*   **Danh sách chu kỳ giá**: Hiển thị Billing Cycle (Tháng/Năm), Price, Khuyến mãi đang áp dụng, Giá sau giảm, và Trạng thái.
*   **Thao tác CRUD Bảng giá**:
    *   **Thêm mới/Chỉnh sửa**: Form Modal chọn chu kỳ (Tháng/Năm), nhập giá và chọn chương trình khuyến mãi từ Dropdown (lấy từ danh sách khuyến mãi đang hoạt động).
    *   **Xóa**: Xóa cấu hình giá cước khỏi gói dịch vụ.
*   **Quản lý Khuyến mãi**:
    *   Danh sách các chương trình khuyến mãi hiện có (Name, DiscountPercentage, StartDate, EndDate).
    *   Nút **"Tạo khuyến mãi"** mở Form nhập thông tin chương trình khuyến mãi mới.
