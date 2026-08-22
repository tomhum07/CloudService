"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "partners">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Orders Search & Filter
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [ordersPage, setOrdersPage] = useState(1);

  // Partners Search & Filter
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState("all");
  const [partnersPage, setPartnersPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const ordersPerPage = 8;
  const partnersPerPage = 8;

  // Filtered Orders (Case-Insensitive)
  const filteredOrders = orders.filter((o) => {
    const term = orderSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (o.code && o.code.toLowerCase().includes(term)) ||
      (o.client && o.client.toLowerCase().includes(term)) ||
      (o.email && o.email.toLowerCase().includes(term)) ||
      (o.plan && o.plan.toLowerCase().includes(term));

    const matchesStatus = orderStatusFilter === "all" ||
      (orderStatusFilter === "pending" && (o.statusCode === 0 || o.statusCode === 1 || o.status === "Chờ duyệt")) ||
      (orderStatusFilter === "completed" && (o.statusCode === 2 || o.status === "Hoàn tất")) ||
      (orderStatusFilter === "cancelled" && (o.statusCode === 3 || o.status === "Đã hủy"));

    return matchesSearch && matchesStatus;
  });

  // Filtered Partners (Case-Insensitive)
  const filteredPartners = partners.filter((p) => {
    const term = partnerSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.channel && p.channel.toLowerCase().includes(term));

    const matchesStatus = partnerStatusFilter === "all" ||
      (partnerStatusFilter === "pending" && (p.status === "Chờ duyệt" || p.statusCode === 1)) ||
      (partnerStatusFilter === "approved" && (p.status === "Đã duyệt" || p.statusCode === 2)) ||
      (partnerStatusFilter === "rejected" && (p.status === "Đã từ chối" || p.statusCode === 3));

    return matchesSearch && matchesStatus;
  });

  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const totalPartnerPages = Math.ceil(filteredPartners.length / partnersPerPage) || 1;

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

  const displayedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);
  const displayedPartners = filteredPartners.slice((partnersPage - 1) * partnersPerPage, partnersPage * partnersPerPage);

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
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuất Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab("orders");
            setOrdersPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "orders"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Đơn Đặt Dịch Vụ ({orders.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("partners");
            setPartnersPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "partners"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Đơn Đăng Ký CTV ({partners.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS TABLE */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Search & Filter Orders Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, khách hàng, email hoặc gói dịch vụ..."
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  setOrdersPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder-slate-400"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {orderSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderSearch("");
                    setOrdersPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setOrdersPage(1);
                }}
                className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white w-full sm:w-44 font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="completed">Hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

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
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {orderSearch ? "Không tìm thấy đơn hàng nào phù hợp với từ khóa." : "Chưa có đơn hàng nào trong cơ sở dữ liệu."}
                      </td>
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
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            Chi tiết
                          </button>
                          {ord.status === "Chờ duyệt" && (
                            <>
                              <button
                                onClick={() => handleOrderStatus(ord.id, "Hoàn tất")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleOrderStatus(ord.id, "Đã hủy")}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors"
                              >
                                Hủy
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalOrderPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Trang {ordersPage} / {totalOrderPages} ({filteredOrders.length} đơn hàng)
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
        </div>
      )}

      {/* TAB 2: PARTNERS TABLE */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          {/* Search & Filter Partners Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Tìm kiếm đối tác theo họ tên, email hoặc kênh quảng bá..."
                value={partnerSearch}
                onChange={(e) => {
                  setPartnerSearch(e.target.value);
                  setPartnersPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder-slate-400"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {partnerSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPartnerSearch("");
                    setPartnersPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={partnerStatusFilter}
                onChange={(e) => {
                  setPartnerStatusFilter(e.target.value);
                  setPartnersPage(1);
                }}
                className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white w-full sm:w-44 font-medium"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>
          </div>

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
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {partnerSearch ? "Không tìm thấy đối tác nào phù hợp với từ khóa." : "Chưa có đơn đăng ký CTV nào."}
                      </td>
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
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
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
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors"
                              >
                                Từ chối
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

            {totalPartnerPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Trang {partnersPage} / {totalPartnerPages} ({filteredPartners.length} đối tác)
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
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
