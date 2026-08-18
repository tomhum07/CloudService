"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

const INITIAL_ORDERS = [
  { id: 1, code: "ORD-94812", client: "Nguyễn Văn Hùng", plan: "VPS Pro", amount: 150000, status: "Hoàn tất", date: "2026-08-16 14:32" },
  { id: 2, code: "ORD-20491", client: "Lê Văn Tám", plan: "Hosting Business", amount: 85000, status: "Chờ duyệt", date: "2026-08-16 11:15" },
  { id: 3, code: "ORD-30194", client: "Phạm Minh Đức", plan: "VPS Starter", amount: 90000, status: "Hoàn tất", date: "2026-08-15 18:40" },
  { id: 4, code: "ORD-58102", client: "Trần Thị Lan", plan: "VPS Enterprise", amount: 320000, status: "Đã hủy", date: "2026-08-15 09:20" },
  { id: 5, code: "ORD-11942", client: "Đoàn Minh Anh", plan: "Hosting Basic", amount: 35000, status: "Chờ duyệt", date: "2026-08-14 16:45" }
];

const INITIAL_PARTNERS = [
  { id: 1, name: "Nguyễn Công Phượng", email: "phuongnc@gmail.com", channel: "youtube.com/c/techreview", bank: "MB Bank - 190038291038", status: "Chờ duyệt", date: "2026-08-16" },
  { id: 2, name: "Vũ Văn Thanh", email: "thanhvv@techblog.vn", channel: "techblog.vn", bank: "Vietcombank - 00110048291", status: "Đã duyệt", date: "2026-08-15" },
  { id: 3, name: "Quế Ngọc Hải", email: "haiqn@outlook.com", channel: "facebook.com/haiqn.dev", bank: "Techcombank - 190338291830", status: "Đã từ chối", date: "2026-08-12" }
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "partners">("orders");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [loading, setLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [partnersPage, setPartnersPage] = useState(1);
  const ordersPerPage = 8;
  const partnersPerPage = 8;
  const totalOrderPages = Math.ceil(orders.length / ordersPerPage) || 1;
  const totalPartnerPages = Math.ceil(partners.length / partnersPerPage) || 1;

  useEffect(() => {
    fetchOrdersAndPartners();
  }, []);

  const fetchOrdersAndPartners = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const orderRes = await apiFetch("/api/order-requests/all");
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (Array.isArray(orderData) && orderData.length > 0) {
          setOrders(orderData.map((o: any) => ({
            id: o.id,
            code: o.orderCode || `ORD-${o.id}`,
            client: o.customerName,
            plan: o.planName,
            amount: o.price || 0,
            status: o.statusName || (o.status === 2 ? "Hoàn tất" : o.status === 3 ? "Đã hủy" : "Chờ duyệt"),
            date: new Date(o.createdAt).toLocaleString("vi-VN")
          })));
        }
      }

      // Fetch Partners
      const partnerRes = await apiFetch("/api/affiliates/all");
      if (partnerRes.ok) {
        const partnerData = await partnerRes.json();
        if (Array.isArray(partnerData) && partnerData.length > 0) {
          setPartners(partnerData.map((p: any) => ({
            id: p.id,
            name: p.fullName,
            email: p.email,
            channel: p.websiteUrl || "Không có",
            bank: p.motivation || "Chưa cập nhật",
            status: p.statusName || (p.status === 2 ? "Đã duyệt" : p.status === 3 ? "Đã từ chối" : "Chờ duyệt"),
            date: new Date(p.createdAt).toLocaleDateString("vi-VN")
          })));
        }
      }
    } catch (err) {
      console.warn("Lỗi lấy dữ liệu:", err);
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
    } catch (err) {
      console.warn("Lỗi API status:", err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === id ? { ...ord, status: newStatus } : ord))
    );
  };

  const handlePartnerStatus = async (id: number, newStatus: "Đã duyệt" | "Đã từ chối") => {
    const statusCode = newStatus === "Đã duyệt" ? 2 : 3;
    try {
      await apiFetch(`/api/affiliates/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusCode })
      });
    } catch (err) {
      console.warn("Lỗi API affiliate status:", err);
    }

    setPartners(prev =>
      prev.map(part => (part.id === id ? { ...part, status: newStatus } : part))
    );
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Quản Lý Đơn Hàng & Đối Tác CTV</h1>
          <p className="text-xs text-slate-500 mt-1">Duyệt kích hoạt dịch vụ và đối soát hoa hồng tiếp thị liên kết</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrdersAndPartners}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors"
          >
            🔄 {loading ? "Đang tải..." : "Làm mới"}
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
                  <th className="py-3.5 px-4 text-right">Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{ord.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{ord.client}</td>
                    <td className="py-3.5 px-4 text-slate-700">{ord.plan}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {typeof ord.amount === "number" ? `${ord.amount.toLocaleString("vi-VN")}đ` : ord.amount}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{ord.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ord.status === "Hoàn tất"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : ord.status === "Đã hủy"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {ord.status === "Chờ duyệt" && (
                        <>
                          <button
                            onClick={() => handleOrderStatus(ord.id, "Hoàn tất")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                          >
                            Kích Hoạt
                          </button>
                          <button
                            onClick={() => handleOrderStatus(ord.id, "Đã hủy")}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {ord.status !== "Chờ duyệt" && (
                        <span className="text-slate-400 font-medium text-[11px]">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalOrderPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Trang {ordersPage} / {totalOrderPages} ({orders.length} đơn)
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
                {displayedPartners.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{part.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{part.email}</td>
                    <td className="py-3.5 px-4 text-blue-600">{part.channel}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">{part.bank}</td>
                    <td className="py-3.5 px-4 text-slate-500">{part.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
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
                ))}
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

    </div>
  );
}
