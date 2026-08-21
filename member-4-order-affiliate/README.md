# Quản lý Đơn hàng & Affiliate

Website hoàn chỉnh cho phần việc **Thành viên 4**, gồm:

- Form đăng ký dịch vụ nhanh tại trang chủ.
- Trang đăng ký đối tác Affiliate.
- Trang Admin xem danh sách, duyệt hoặc hủy yêu cầu.
- API tạo và cập nhật trạng thái đơn dịch vụ/Affiliate.
- Dữ liệu lưu tại `data/db.json`.

> Đây là bản chạy độc lập bằng Node.js, không cần cài thêm thư viện. Nếu ghép vào
> dự án CloudServices .NET 10 của nhóm, giữ nguyên hợp đồng API và chuyển phần lưu
> dữ liệu trong `server.js` sang Controller/Service/EF Core của dự án chính.

## Chạy dự án

Yêu cầu Node.js 18 trở lên.

```bash
npm start
```

Mở `http://localhost:3000`. Trang quản trị tại `http://localhost:3000/admin`.

## Kiểm thử API

```bash
npm test
```

## API

| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| POST | `/api/order-requests` | Tạo đơn đăng ký dịch vụ |
| GET | `/api/order-requests` | Danh sách đơn dịch vụ |
| PATCH | `/api/order-requests/{id}/status` | Duyệt/hủy đơn dịch vụ |
| POST | `/api/affiliates` | Tạo đăng ký Affiliate |
| GET | `/api/affiliates` | Danh sách Affiliate |
| PATCH | `/api/affiliates/{id}/status` | Duyệt/hủy Affiliate |
