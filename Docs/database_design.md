# Tài Liệu Đặc Tả Thiết Kế Cơ Sở Dữ Liệu
## Dự án: Website Bán Dịch vụ Cloud (CloudService)

Tài liệu này đặc tả chi tiết cấu trúc các bảng dữ liệu trong CSDL SQL Server của dự án `CloudService`. Hệ thống áp dụng quy tắc đặt tên khóa chính kiểu số nguyên tự tăng (`int`), cơ chế xóa mềm (`Soft Delete`) và được cấu hình bằng Fluent API.

---

## 1. Sơ đồ Quan hệ Thực thể (Entity Relationship Diagram - ERD)

```text
[ServiceCategory] (1) ───◄ (N) [ServicePlan]
                                   │ (1)
                                   ├───◄ (N) [PlanPrice] (Chu kỳ giá)
                                   │             │ (1)
                                   │             └───◄ (N) [OrderRequest]
                                   ▼ (0..1)
                              [Promotion] (Khuyến mãi)

[Roles] (1) ───◄ (N) [AppUsers]
                        │ (1)
                        └───◄ (N) [AuditLogs] (Nhật ký hệ thống)

[AffiliateApplication] (Đăng ký CTV độc lập)
```

---

## 2. Chi Tiết Cấu Trúc Các Bảng (Tables Schema)

### Lớp Cơ Sở (`BaseEntity`)
Tất cả các bảng bên dưới (ngoại trừ bảng trung gian hoặc bảng nhật ký đặc thù nếu có) đều kế thừa các cột cơ sở sau:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`Id`** | `int` | Primary Key, Identity(1,1) | Khóa chính tự tăng. |
| **`IsActive`** | `bit` | Default `1` (True) | Trạng thái hoạt động (Dùng cho Xóa mềm - Soft Delete). |
| **`CreatedAt`** | `datetime2` | Not Null | Thời điểm tạo bản ghi. |
| **`LastModifiedAt`** | `datetime2` | Nullable | Thời điểm cập nhật bản ghi gần nhất. |

---

### Phân Hệ 1: Xác Thực & Phân Quyền

#### Bảng `Roles` (Vai trò người dùng)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`Name`** | `nvarchar(50)` | Not Null, Unique | Tên vai trò (Ví dụ: `"Admin"`, `"Editor"`). |
| **`Description`** | `nvarchar(250)`| Nullable | Mô tả quyền hạn của vai trò. |

#### Bảng `AppUsers` (Tài khoản quản trị)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`Username`** | `varchar(50)` | Not Null, Unique | Tên tài khoản đăng nhập. |
| **`PasswordHash`**| `varchar(255)`| Not Null | Mật khẩu băm (BCrypt). |
| **`FullName`** | `nvarchar(100)`| Not Null | Họ và tên đầy đủ. |
| **`Email`** | `varchar(100)`| Not Null, Unique | Địa chỉ email của người dùng. |
| **`RoleId`** | `int` | Foreign Key -> `Roles(Id)` | Liên kết vai trò của người dùng. |
| **`RefreshToken`**| `varchar(255)`| Nullable | Token làm mới phiên đăng nhập JWT. |
| **`RefreshTokenExpiryTime`** | `datetime2` | Nullable | Thời gian hết hạn của Refresh Token. |

---

### Phân Hệ 2: Danh Mục Dịch Vụ & Khuyến Mãi

#### Bảng `ServiceCategories` (Danh mục dịch vụ)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`Name`** | `nvarchar(100)`| Not Null | Tên danh mục (Ví dụ: `"VPS"`, `"Hosting"`). |
| **`Slug`** | `varchar(150)` | Not Null, Unique | Đường dẫn URL thân thiện cho SEO. |
| **`Description`** | `nvarchar(max)`| Nullable | Mô tả chi tiết danh mục. |

#### Bảng `ServicePlans` (Gói cấu hình dịch vụ)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`CategoryId`** | `int` | Foreign Key -> `ServiceCategories(Id)` | Thuộc về danh mục nào. |
| **`Name`** | `nvarchar(100)`| Not Null | Tên gói dịch vụ (Ví dụ: `"VPS PRO 1"`). |
| **`Description`** | `nvarchar(max)`| Nullable | Mô tả chi tiết gói. |
| **`Cpu`** | `nvarchar(50)` | Nullable | Thông số CPU (Ví dụ: `"2 Cores"`). |
| **`Ram`** | `nvarchar(50)` | Nullable | Thông số RAM (Ví dụ: `"4 GB"`). |
| **`Storage`** | `nvarchar(50)` | Nullable | Thông số ổ cứng (Ví dụ: `"40 GB SSD"`). |
| **`Bandwidth`** | `nvarchar(50)` | Nullable | Băng thông mạng (Ví dụ: `"100 Mbps"`). |
| **`QrCodeUrl`** | `varchar(255)` | Nullable | Đường dẫn lưu file ảnh mã QR để đặt hàng. |

#### Bảng `Promotions` (Chương trình khuyến mãi)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`Name`** | `nvarchar(150)`| Not Null | Tên chiến dịch khuyến mãi. |
| **`DiscountPercentage`**| `int` | Not Null, Check(0..100) | Phần trăm giảm giá (Ví dụ: `10` -> Giảm 10%). |
| **`StartDate`** | `datetime2` | Not Null | Ngày bắt đầu chương trình. |
| **`EndDate`** | `datetime2` | Not Null | Ngày kết thúc chương trình. |

#### Bảng `PlanPrices` (Mức giá theo chu kỳ thanh toán)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`PlanId`** | `int` | FK -> `ServicePlans(Id)`, Delete Cascade | Thuộc về gói dịch vụ nào. |
| **`BillingCycle`**| `nvarchar(50)` | Not Null | Chu kỳ thanh toán (Ví dụ: `"Monthly"`, `"Annually"`). |
| **`Price`** | `decimal(18,2)`| Not Null | Giá gốc của gói theo chu kỳ tương ứng. |
| **`PromotionId`** | `int` | FK -> `Promotions(Id)`, Nullable | Mã khuyến mãi đang áp dụng (nếu có). |

---

### Phân Hệ 3: Khách Hàng, Cộng Tác Viên & Nhật Ký

#### Bảng `OrderRequests` (Yêu cầu đăng ký đặt dịch vụ)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`PlanPriceId`** | `int` | Foreign Key -> `PlanPrices(Id)` | Khách hàng đặt mua gói dịch vụ + chu kỳ nào. |
| **`CustomerName`**| `nvarchar(100)`| Not Null | Tên khách hàng. |
| **`CustomerEmail`**| `varchar(100)` | Not Null | Email khách hàng. |
| **`CustomerPhone`**| `varchar(20)`  | Not Null | Số điện thoại khách hàng. |
| **`CompanyName`** | `nvarchar(150)`| Nullable | Tên công ty/doanh nghiệp. |
| **`Status`** | `int` | Not Null, Default `0` | Trạng thái (0: Mới, 1: Đang xử lý, 2: Hoàn tất, 3: Bị từ chối). |
| **`Notes`** | `nvarchar(500)`| Nullable | Ghi chú của khách hàng hoặc Admin. |

#### Bảng `AffiliateApplications` (Đăng ký cộng tác viên)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`FullName`** | `nvarchar(100)`| Not Null | Họ tên cộng tác viên. |
| **`Email`** | `varchar(100)` | Not Null, Unique | Email liên hệ. |
| **`Phone`** | `varchar(20)`  | Not Null | Số điện thoại. |
| **`WebsiteUrl`** | `varchar(255)` | Nullable | Link website/facebook giới thiệu. |
| **`Motivation`** | `nvarchar(max)`| Nullable | Mục đích hoặc kế hoạch quảng bá. |
| **`Status`** | `int` | Not Null, Default `0` | Trạng thái (0: Mới, 1: Đang duyệt, 2: Thành công, 3: Từ chối). |

#### Bảng `AuditLogs` (Nhật ký hệ thống)
*Kế thừa từ `BaseEntity`*

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| **`UserId`** | `int` | FK -> `AppUsers(Id)`, Nullable | ID của Admin/Editor thực hiện hành động. |
| **`Username`** | `varchar(50)` | Not Null | Tên tài khoản thực hiện (lưu để xem nhanh). |
| **`Action`** | `nvarchar(100)`| Not Null | Hành động thực hiện (Ví dụ: `"Thay đổi giá gói VPS"`). |
| **`Payload`** | `nvarchar(max)`| Nullable | Dữ liệu cũ và mới dạng JSON để so sánh. |
| **`Timestamp`** | `datetime2` | Not Null | Thời điểm xảy ra hành động. |
