"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "partners">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [partnersPage, setPartnersPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const ordersPerPage = 8;
  const partnersPerPage = 8;
  const totalOrderPages = Math.ceil(orders.length / ordersPerPage) || 1;
  const totalPartnerPages = Math.ceil(partners.length / partnersPerPage) || 1;

  useEffect(() => {
    fetchOrdersAndPartners();

    // Lắng nghe SignalR để tự động cập nhật danh sách đơn hàng khi có đơn mới hoặc thanh toán thành công
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "order" || entity === "affiliate" || entity === "all") {
        fetchOrdersAndPartners(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchOrdersAndPartners = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Fetch Orders
      const orderRes = await apiFetch("/api/order-requests/all");
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const rawItems = orderData.items || orderData;
        if (Array.isArray(rawItems)) {
          setOrders(rawItems.map((o: any) => ({
            id: o.id,
            code: o.orderCode || `ORD-${o.id}`,
            client: o.customerName || "Khách vãng lai",
            email: o.customerEmail || "Không có",
            phone: o.customerPhone || "Không có",
            company: o.companyName || "Cá nhân",
            plan: o.planName || "Gói dịch vụ",
            category: o.categoryName || "Hạ tầng Cloud",
            cycle: o.billingCycle || "Theo tháng",
            amount: o.price || 0,
            notes: o.notes || "Không có ghi chú thêm",
            status: o.statusName || (o.status === 2 ? "Hoàn tất" : o.status === 3 ? "Đã hủy" : "Chờ duyệt"),
            statusCode: o.status,
            date: new Date(o.createdAt).toLocaleString("vi-VN")
          })));
        }
      }

      // Fetch Partners
      const partnerRes = await apiFetch("/api/affiliates/all");
      if (partnerRes.ok) {
        const partnerData = await partnerRes.json();
        const rawItems = partnerData.items || partnerData;
        if (Array.isArray(rawItems)) {
          setPartners(rawItems.map((p: any) => ({
            id: p.id,
            name: p.fullName || "Chưa cập nhật",
            email: p.email,
            channel: p.websiteUrl || "Không có",
            bank: p.motivation || "Chưa cập nhật",
            status: p.statusName || (p.status === 2 ? "Đã duyệt" : p.status === 3 ? "Đã từ chối" : "Chờ duyệt"),
            date: new Date(p.createdAt).toLocaleDateString("vi-VN")
          })));
        }
      }
    } catch (err) {
      console.warn("Lỗi lấy dữ liệu từ Backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatus = async (id: number, newStatus: "Hoàn tất" | "Đã hủy") => {
    const statusCode = newStatus === "Hoàn tất" ? 2 : 3;
    try {
      await apiFetch(`/api/order-requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusCode, notes: `Admin cập nhật: ${newStatus}` })
      });
      fetchOrdersAndPartners();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, statusCode });
      }
    } catch (err) {
      console.warn("Lỗi API status:", err);
    }
  };

  const handlePartnerStatus = async (id: number, newStatus: "Đã duyệt" | "Đã từ chối") => {
    const statusCode = newStatus === "Đã duyệt" ? 2 : 3;
    try {
      await apiFetch(`/api/affiliates/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusCode })
      });
      fetchOrdersAndPartners();
    } catch (err) {
      console.warn("Lỗi API affiliate status:", err);
    }
  };

  const handleExportExcel = async () => {
    if (activeTab === "orders") {
      try {
        const res = await apiFetch("/api/order-requests/export-excel");
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      } catch (err) {
        console.warn("Fallback to CSV:", err);
      }
    }

    let headers = "";
    let rows = "";
    let filename = "";

    if (activeTab === "orders") {
      headers = "Ma Don Hang,Khach Hang,Goi Dich Vu,Tong Tien,Trang Thai,Ngay Dat\n";
      rows = orders
        .map(o => `${o.code},${o.client},${o.plan},${o.amount},${o.status},${o.date}`)
        .join("\n");
      filename = `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = "Ten Doi Tac,Email,Kenh Quang Ba,Ngan Hang,Trang Thai,Ngay Dang Ky\n";
      rows = partners
        .map(p => `${p.name},${p.email},${p.channel},${p.bank.replace(/,/g, " ")},${p.status},${p.date}`)
        .join("\n");
      filename = `danh_sach_ctv_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedOrders = orders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const displayedPartners = partners.slice((partnersPage - 1) * partnersPerPage, partnersPage * partnersPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">Quản Lý Đơn Hàng & Đối Tác CTV</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dữ liệu đơn hàng thực tế đồng bộ trực tiếp từ cơ sở dữ liệu</p>
        </div>
        <div className="flex items-center gap-3">
          <button
          onClick={() => fetchOrdersAndPartners(false)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <span className="text-sm">🔄</span> Làm Mới
        </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20"
          >
            <span>📥</span>
            <span>Xuất Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "orders"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          🛒 Đơn Đặt Dịch Vụ ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "partners"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          👥 Đơn Đăng Ký CTV ({partners.length})
        </button>
      </div>

      {/* TAB 1: ORDERS TABLE */}
      {activeTab === "orders" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn</th>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Gói Dịch Vụ</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Đang tải danh sách đơn hàng...</td>
                  </tr>
                ) : displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Chưa có đơn hàng nào trong cơ sở dữ liệu.</td>
                  </tr>
                ) : (
                  displayedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{ord.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ord.client}</div>
                        <div className="text-[11px] text-slate-400">{ord.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{ord.plan}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {typeof ord.amount === "number" ? `${ord.amount.toLocaleString("vi-VN")}đ` : ord.amount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{ord.date}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          ord.status === "Hoàn tất"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ord.status === "Đã hủy"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] transition-colors border border-blue-200 inline-flex items-center gap-1.5"
                        >
                          <span>👁️</span>
                          <span>Xem Chi Tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalOrderPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Trang {ordersPage} / {totalOrderPages} ({orders.length} đơn hàng)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrdersPage(p => Math.max(p - 1, 1))}
                  disabled={ordersPage === 1}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
                >
                  Trước
                </button>
                <button
                  onClick={() => setOrdersPage(p => Math.min(p + 1, totalOrderPages))}
                  disabled={ordersPage === totalOrderPages}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARTNERS TABLE */}
      {activeTab === "partners" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tên Đối Tác</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Kênh Quảng Bá</th>
                  <th className="py-3.5 px-4">Thông Tin Nhận Hoa Hồng</th>
                  <th className="py-3.5 px-4">Ngày Đăng Ký</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Phê Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Đang tải danh sách CTV...</td>
                  </tr>
                ) : displayedPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Chưa có đơn đăng ký CTV nào.</td>
                  </tr>
                ) : (
                  displayedPartners.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{part.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{part.email}</td>
                      <td className="py-3.5 px-4 text-blue-600">{part.channel}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{part.bank}</td>
                      <td className="py-3.5 px-4 text-slate-500">{part.date}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          part.status === "Đã duyệt"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : part.status === "Đã từ chối"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {part.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {part.status === "Chờ duyệt" && (
                          <>
                            <button
                              onClick={() => handlePartnerStatus(part.id, "Đã duyệt")}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handlePartnerStatus(part.id, "Đã từ chối")}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                            >
                              Từ Chối
                            </button>
                          </>
                        )}
                        {part.status !== "Chờ duyệt" && (
                          <span className="text-slate-400 font-medium text-[11px]">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPartnerPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Trang {partnersPage} / {totalPartnerPages} ({partners.length} đối tác)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPartnersPage(p => Math.max(p - 1, 1))}
                  disabled={partnersPage === 1}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPartnersPage(p => Math.min(p + 1, totalPartnerPages))}
                  disabled={partnersPage === totalPartnerPages}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  📦
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Chi Tiết Đơn Hàng <span className="font-mono text-blue-600">#{selectedOrder.code}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Thời gian tạo: {selectedOrder.date}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Chi tiết thông tin */}
            <div className="space-y-4 text-xs">
              
              {/* Thông tin khách hàng */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-blue-600">
                  Thông Tin Khách Hàng
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block">Họ và Tên:</span>
                    <strong className="font-semibold text-slate-900">{selectedOrder.client}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Số Điện Thoại:</span>
                    <strong className="font-mono text-slate-900">{selectedOrder.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Địa Chỉ Email:</span>
                    <strong className="text-slate-900">{selectedOrder.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Công Ty / Tổ Chức:</span>
                    <strong className="text-slate-900">{selectedOrder.company}</strong>
                  </div>
                </div>
              </div>

              {/* Thông tin dịch vụ & thanh toán */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-blue-600">
                  Thông Tin Dịch Vụ & Thanh Toán
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block">Gói Cước:</span>
                    <strong className="text-slate-900">{selectedOrder.plan}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Danh Mục:</span>
                    <strong className="text-slate-900">{selectedOrder.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Chu Kỳ Thanh Toán:</span>
                    <strong className="text-slate-900">{selectedOrder.cycle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tổng Số Tiền:</span>
                    <strong className="text-rose-600 text-sm font-black">
                      {typeof selectedOrder.amount === "number" ? `${selectedOrder.amount.toLocaleString("vi-VN")}đ` : selectedOrder.amount}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Ghi chú & Lịch sử PayOS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-blue-600">
                  Ghi Chú Đơn Hàng & Lịch Sử Giao Dịch
                </h4>
                <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                  {selectedOrder.notes}
                </p>
              </div>

              {/* Trạng thái hiện tại */}
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 font-medium">Trạng thái đơn hàng:</span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  selectedOrder.status === "Hoàn tất"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : selectedOrder.status === "Đã hủy"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Footer Modal Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="italic text-[11px]">
                * Hệ thống tự động đồng bộ và kích hoạt đơn hàng qua cổng thanh toán PayOS.
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
