# Kế Hoạch Đồng Bộ Hóa Giao Diện Toàn Dự Án (Frontend Design Alignment)

Theo chỉ dẫn của skill **`frontend-design`**, dự án CloudService sẽ được chuẩn hóa nhận diện thương hiệu nhất quán, từ bỏ tình trạng lai tạp giữa Dark Theme cũ và Light Theme mới, chuyển sang hệ thống **Clean Enterprise Light Theme với điểm nhấn Royal Blue (#2563eb / #1d4ed8)** lấy cảm hứng từ các nhà cung cấp Cloud hàng đầu (Vietnix, Viettel IDC, DigitalOcean).

## 🎨 1. Bảng màu & Typography Nhất Quán (Design Tokens)

* **Nền chính (Canvas Background)**: `#f8fafc` (Slate-50) & `#ffffff` (Pure White).
* **Màu chữ & Cấp bậc nội dung**:
  - Tiêu đề chính / H1 / H2: `#0f172a` (Slate-900) font-extrabold.
  - Phụ đề / Đoạn văn: `#334155` (Slate-700) & `#64748b` (Slate-500).
* **Màu thương hiệu & Điểm nhấn (Brand Accent)**:
  - Primary Blue: `#2563eb` (Blue-600) & `#1d4ed8` (Blue-700 hover).
  - Subtle Blue Surface: `#eff6ff` (Blue-50).
  - Border Accents: `#e2e8f0` (Slate-200) & `#bfdbfe` (Blue-200).
  - Status Success: `#10b981` (Emerald-500).
* **Signature Element**: Bảng điều khiển dịch vụ trực quan, thanh đo hiệu năng tốc độ động, badge chứng nhận công nghệ và khối Mega Menu tương tác.

---

## 🛠️ 2. Các trang sẽ tiến hành đồng bộ giao diện

1. **[`globals.css`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/globals.css)**: Cập nhật CSS variables gốc sang nền sáng `#f8fafc`, chữ `#0f172a`, border `#e2e8f0`.
2. **[`components/Footer.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/components/Footer.tsx)**: Chuyển Footer từ nền tối sang nền sáng sạch sẽ, viền xám mềm, phân nhóm danh mục rõ ràng.
3. **[`app/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/page.tsx)**: Đồng bộ toàn bộ Trang Chủ sang Light Theme thanh lịch (Hero search, Stats bar, Tabs dịch vụ, Bảng giá, Khối Anti-DDoS, Testimonials và Tin tức).
4. **[`app/pricing/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/pricing/page.tsx)**: Chuyển bảng giá so sánh đa chu kỳ (tháng/năm) sang nền sáng.
5. **[`app/about/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/about/page.tsx)**: Chuẩn hóa trang Giới thiệu, bảng thông số Datacenter Tier 3 và chính sách cam kết SLA 99.99%.
6. **[`app/login/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/login/page.tsx)** & **[`app/register/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/register/page.tsx)**: Đồng bộ form đăng nhập / đăng ký sang giao diện sáng chuyên nghiệp.
7. **[`app/affiliate/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/affiliate/page.tsx)**: Chuẩn hóa trang Tiếp thị liên kết (CTV).
8. **[`app/news/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/news/page.tsx)**: Chuẩn hóa trang Danh sách tin tức & blog.
9. **[`app/order/page.tsx`](file:///d:/CODE/CODE_VS/BTL_PTPMHDT/front-end/app/order/page.tsx)**: Đảm bảo trang đặt hàng ăn khớp 100% với Header và Footer.
