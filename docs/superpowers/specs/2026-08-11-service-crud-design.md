# Design Specification: Service CRUD & Cascade Soft Delete API

Tài liệu đặc tả thiết kế chi tiết cho phân hệ quản lý Danh mục dịch vụ, Gói cước và Bảng giá trong dự án **CloudServices**.

---

## 1. Dữ liệu truyền nhận (DTOs)

Các DTO này nằm ở dự án **`CloudService.Application`** trong thư mục `DTOs/Services`:

### 1.1. DTOs cho Danh mục dịch vụ (ServiceCategory)
*   **`ServiceCategoryDto`**: Chứa thông tin đầy đủ trả về cho Client.
*   **`CreateServiceCategoryRequest`** & **`UpdateServiceCategoryRequest`**: Nhận dữ liệu đầu vào từ Admin.

### 1.2. DTOs cho Gói cước dịch vụ (ServicePlan)
*   **`ServicePlanDto`**: Trả về thông tin gói cước kèm theo tên danh mục cha (`CategoryName`).
*   **`CreateServicePlanRequest`**: Cho phép chỉ định `CategoryId`.
*   **`UpdateServicePlanRequest`**: Chỉ cho sửa cấu hình thông số kỹ thuật (không cho sửa `CategoryId`).

### 1.3. DTOs cho Bảng giá và Khuyến mãi (PlanPrice & Promotion)
*   **`PlanPriceDto`**: Trả về thông tin bảng giá kèm chi tiết chương trình khuyến mãi nếu có (`PromotionName`, `DiscountPercentage`).
*   **`CreatePlanPriceRequest`** & **`UpdatePlanPriceRequest`**: Cho phép thiết lập chu kỳ, đơn giá và liên kết khuyến mãi.
*   **`PromotionDto`** & **`CreatePromotionRequest`**: Quản lý chương trình khuyến mãi.

---

## 2. Giao diện Nghiệp vụ (Interfaces)

Các interface nằm trong dự án **`CloudService.Application`** thư mục `Interfaces`:

```csharp
namespace CloudService.Application.Interfaces
{
    public interface IServiceCategoryService
    {
        Task<IEnumerable<ServiceCategoryDto>> GetAllAsync();
        Task<ServiceCategoryDto?> GetByIdAsync(int id);
        Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryRequest request);
        Task<ServiceCategoryDto?> UpdateAsync(int id, UpdateServiceCategoryRequest request);
        Task<bool> DeleteAsync(int id);
    }

    public interface IServicePlanService
    {
        Task<PagedResult<ServicePlanDto>> GetPagedAsync(int page, int pageSize, int? categoryId, string? search, string? sort);
        Task<ServicePlanDto?> GetByIdAsync(int id);
        Task<ServicePlanDto> CreateAsync(CreateServicePlanRequest request);
        Task<ServicePlanDto?> UpdateAsync(int id, UpdateServicePlanRequest request);
        Task<bool> DeleteAsync(int id);
    }

    public interface IPlanPriceService
    {
        Task<IEnumerable<PlanPriceDto>> GetPricesByPlanIdAsync(int planId);
        Task<PlanPriceDto> CreatePriceAsync(int planId, CreatePlanPriceRequest request);
        Task<PlanPriceDto?> UpdatePriceAsync(int planId, int priceId, UpdatePlanPriceRequest request);
        Task<bool> DeletePriceAsync(int planId, int priceId);
        Task<IEnumerable<PromotionDto>> GetAllPromotionsAsync();
        Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request);
    }
}
```

---

## 3. Logic Xóa mềm đồng loạt (Cascade Soft Delete)

Việc xóa mềm đồng loạt được thực hiện ở lớp triển khai Service (tầng **`CloudService.Infrastructure`**):

### 3.1. Xóa mềm Danh mục (`ServiceCategory`)
Khi xóa một danh mục:
1.  Tải danh mục lên kèm toàn bộ gói cước (`ServicePlans`) và bảng giá (`PlanPrices`).
2.  Thiết lập `IsActive = false` cho danh mục.
3.  Lặp qua từng gói cước trực thuộc danh mục:
    *   Thiết lập `IsActive = false` cho gói cước.
    *   Lặp qua từng bảng giá của gói cước đó và gán `IsActive = false`.
4.  Lưu các thay đổi vào CSDL thông qua `DbContext.SaveChangesAsync()`.

### 3.2. Xóa mềm Gói cước (`ServicePlan`)
Khi xóa một gói cước:
1.  Tải gói cước lên kèm toàn bộ bảng giá (`PlanPrices`).
2.  Thiết lập `IsActive = false` cho gói cước.
3.  Lặp qua từng bảng giá trực thuộc gói cước đó và gán `IsActive = false`.
4.  Lưu các thay đổi.

---

## 4. API Endpoints & Phân quyền (Authorization Matrix)

### 4.1. Danh mục dịch vụ
*   `GET /api/service-categories` $\rightarrow$ Công khai
*   `GET /api/service-categories/{id}` $\rightarrow$ Công khai
*   `POST /api/service-categories` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `PUT /api/service-categories/{id}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `DELETE /api/service-categories/{id}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)

### 4.2. Gói cước dịch vụ
*   `GET /api/service-plans` $\rightarrow$ Công khai (Có phân trang, tìm kiếm, lọc)
*   `GET /api/service-plans/{id}` $\rightarrow$ Công khai
*   `POST /api/service-plans` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `PUT /api/service-plans/{id}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `DELETE /api/service-plans/{id}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)

### 4.3. Bảng giá & Khuyến mãi
*   `GET /api/service-plans/{id}/prices` $\rightarrow$ Công khai
*   `POST /api/service-plans/{id}/prices` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `PUT /api/service-plans/{id}/prices/{priceId}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `DELETE /api/service-plans/{id}/prices/{priceId}` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
*   `GET /api/promotions` $\rightarrow$ Công khai
*   `POST /api/promotions` $\rightarrow$ Admin (`[Authorize(Roles = "Admin")]`)
