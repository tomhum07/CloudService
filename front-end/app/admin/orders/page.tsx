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
      console.warn("Failed to fetch orders/partners, using initial dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tab 1: Orders Approval Actions
  const handleOrderStatus = async (id: number, newStatus: "Hoàn tất" | "Đã hủy") => {
    const statusCode = newStatus === "Hoàn tất" ? 2 : 3;
    try {
      await apiFetch(`/api/order-requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusCode, notes: `Admin cập nhật: ${newStatus}` })
      });
    } catch (err) {
      console.warn("API status update error:", err);
    }

    setOrders(prev =>
      prev.map(ord => (ord.id === id ? { ...ord, status: newStatus } : ord))
    );
  };

  // Tab 2: Partner Approval Actions
  const handlePartnerStatus = async (id: number, newStatus: "Đã duyệt" | "Đã từ chối") => {
    const statusCode = newStatus === "Đã duyệt" ? 2 : 3;
    try {
      await apiFetch(`/api/affiliates/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusCode })
      });
    } catch (err) {
      console.warn("API affiliate status update error:", err);
    }

    setPartners(prev =>
      prev.map(part => (part.id === id ? { ...part, status: newStatus } : part))
    );
  };

  // Excel (CSV) Export Handler
  const handleExportExcel = async () => {
    if (activeTab === "orders") {
      try {
        const res = await apiFetch("/api/order-requests/export");
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      } catch (err) {
        console.warn("Backend CSV export error, falling back to client CSV:", err);
      }
    }

    // Client fallback export
    let headers = "";
    let rows = "";
    let filename = "";

    if (activeTab === "orders") {
      headers = "Ma Don Hang,Khach Hang,Goi Dich Vu,Tong Tien,Trang Thai,Ngay Dat\n";
      rows = orders
        .map(
          o =>
            `${o.code},${o.client},${o.plan},${o.amount},${o.status},${o.date}`
        )
        .join("\n");
      filename = `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      headers = "Ten Doi Tac,Email,Kenh Quang Ba,Ngan Hang,Trang Thai,Ngay Dang Ky\n";
      rows = partners
        .map(
          p =>
            `${p.name},${p.email},${p.channel},${p.bank.replace(/,/g, " ")},${p.status},${p.date}`
        )
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

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Quản Lý Đơn Hàng & Đối Tác CTV</h1>
          <p className="text-xs text-slate-400 mt-1">
            Phê duyệt thanh toán hóa đơn và quản lý đối tác tiếp thị liên kết.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-2"
        >
          📥 Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "orders"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5"
          }`}
        >
          📦 Duyệt Đơn Hàng ({orders.filter(o => o.status === "Chờ duyệt" || o.status === "Đang xử lý").length})
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "partners"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5"
          }`}
        >
          👥 Đối Tác CTV ({partners.filter(p => p.status === "Chờ duyệt").length})
        </button>
      </div>

      {/* Tab 1: Orders Table */}
      {activeTab === "orders" && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="pb-3">Mã đơn</th>
                  <th className="pb-3">Họ tên khách</th>
                  <th className="pb-3">Gói cước</th>
                  <th className="pb-3">Tổng cộng</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Ngày đặt</th>
                  <th className="pb-3 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {orders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage).map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-200">{ord.code}</td>
                    <td className="py-3.5">{ord.client}</td>
                    <td className="py-3.5">{ord.plan}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-100">{formatPrice(ord.amount)}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        ord.status === "Hoàn tất"
                          ? "bg-green-950 text-green-400"
                          : ord.status === "Chờ duyệt" || ord.status === "Đang xử lý"
                          ? "bg-yellow-950 text-yellow-400"
                          : "bg-red-950 text-red-400"
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{ord.date}</td>
                    <td className="py-3.5 text-right space-x-2">
                      {ord.status === "Chờ duyệt" || ord.status === "Đang xử lý" ? (
                        <>
                          <button
                            onClick={() => handleOrderStatus(ord.id, "Hoàn tất")}
                            className="px-2 py-1 bg-green-900/40 hover:bg-green-800/40 border border-green-800 text-[10px] font-bold rounded text-green-400 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleOrderStatus(ord.id, "Đã hủy")}
                            className="px-2 py-1 bg-red-900/40 hover:bg-red-800/40 border border-red-800 text-[10px] font-bold rounded text-red-400 transition-colors"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalOrderPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/5 text-slate-400 text-xs">
                <div>Trang {ordersPage}/{totalOrderPages} — {orders.length} đơn hàng</div>
                <div className="flex gap-2">
                  <button type="button" disabled={ordersPage === 1} onClick={() => setOrdersPage(1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Đầu</button>
                  <button type="button" disabled={ordersPage === 1} onClick={() => setOrdersPage(p => p - 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Trước</button>
                  <button type="button" disabled={ordersPage === totalOrderPages} onClick={() => setOrdersPage(p => p + 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Sau</button>
                  <button type="button" disabled={ordersPage === totalOrderPages} onClick={() => setOrdersPage(totalOrderPages)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Cuối</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Affiliate CTV applications */}
      {activeTab === "partners" && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="pb-3">Họ tên CTV</th>
                  <th className="pb-3">Kênh truyền thông</th>
                  <th className="pb-3">Tài khoản ngân hàng</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Ngày gửi</th>
                  <th className="pb-3 text-right">Phê duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {partners.slice((partnersPage - 1) * partnersPerPage, partnersPage * partnersPerPage).map((part) => (
                  <tr key={part.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-slate-200">
                      {part.name}
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{part.email}</span>
                    </td>
                    <td className="py-3.5 font-mono text-[10px] text-slate-400 max-w-xs truncate">{part.channel}</td>
                    <td className="py-3.5 font-mono text-[10px] text-slate-400">{part.bank}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        part.status === "Đã duyệt"
                          ? "bg-green-950 text-green-400"
                          : part.status === "Chờ duyệt"
                          ? "bg-yellow-950 text-yellow-400"
                          : "bg-red-950 text-red-400"
                      }`}>
                        {part.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">{part.date}</td>
                    <td className="py-3.5 text-right space-x-2">
                      {part.status === "Chờ duyệt" ? (
                        <>
                          <button
                            onClick={() => handlePartnerStatus(part.id, "Đã duyệt")}
                            className="px-2 py-1 bg-green-900/40 hover:bg-green-800/40 border border-green-800 text-[10px] font-bold rounded text-green-400 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handlePartnerStatus(part.id, "Đã từ chối")}
                            className="px-2 py-1 bg-red-900/40 hover:bg-red-800/40 border border-red-800 text-[10px] font-bold rounded text-red-400 transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPartnerPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/5 text-slate-400 text-xs">
                <div>Trang {partnersPage}/{totalPartnerPages} — {partners.length} CTV</div>
                <div className="flex gap-2">
                  <button type="button" disabled={partnersPage === 1} onClick={() => setPartnersPage(1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Đầu</button>
                  <button type="button" disabled={partnersPage === 1} onClick={() => setPartnersPage(p => p - 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Trước</button>
                  <button type="button" disabled={partnersPage === totalPartnerPages} onClick={() => setPartnersPage(p => p + 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Sau</button>
                  <button type="button" disabled={partnersPage === totalPartnerPages} onClick={() => setPartnersPage(totalPartnerPages)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Cuối</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
