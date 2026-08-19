"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, getAccessToken, refreshAccessToken } from "@/utils/api";

export default function MyPlansPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadMyOrders();
  }, []);

  const loadMyOrders = async () => {
    setLoading(true);
    let token = getAccessToken();
    if (!token) {
      const ok = await refreshAccessToken();
      if (ok) token = getAccessToken();
    }

    if (token) {
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const payload = JSON.parse(window.atob(payloadPart));
          const username = payload["sub"] || payload["name"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
          setUser({ username });
        }
      } catch (e) {
        console.error("Lỗi giải mã token:", e);
      }
    }

    try {
      const res = await apiFetch("/api/order-requests/my-orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải đơn hàng của tôi:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getStatusBadge = (status: number, statusName?: string) => {
    switch (status) {
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Đang Hoạt Động
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            ⚙️ Đang Khởi Tạo
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            🔴 Đã Hủy
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            🟡 Chờ Kích Hoạt (Thanh Toán)
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchSearch;
    if (statusFilter === "active") return matchSearch && o.status === 2;
    if (statusFilter === "pending") return matchSearch && (o.status === 0 || o.status === 1);
    if (statusFilter === "cancelled") return matchSearch && o.status === 3;
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-600 mb-2">
              <span>📦</span> CỔNG QUẢN LÝ DỊCH VỤ KHÁCH HÀNG
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Gói Cước Của Tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi tình trạng máy chủ Cloud VPS, Web Hosting, chu kỳ cước và yêu cầu hỗ trợ kỹ thuật
            </p>
          </div>

          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>➕</span>
            <span>Đăng Ký Gói Mới</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tìm theo mã đơn (CS-...), tên gói cước..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang hoạt động</option>
              <option value="pending">🟡 Chờ kích hoạt / Đang khởi tạo</option>
              <option value="cancelled">🔴 Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách dịch vụ của bạn...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl mx-auto mb-4 text-blue-600">
              📭
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa Có Gói Dịch Vụ Nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Bạn chưa đăng ký dịch vụ nào hoặc chưa có đơn hàng nào được tạo. Hãy tham khảo bảng giá dịch vụ Cloud VPS & Hosting để trải nghiệm.
            </p>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all inline-block"
            >
              Khám Phá Bảng Giá Dịch Vụ →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {order.orderCode}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mt-2">
                        {order.planName}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">{order.categoryName || "Hạ tầng Cloud"}</span>
                    </div>
                    <div>
                      {getStatusBadge(order.status, order.statusName)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Chu kỳ thanh toán</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        {order.billingCycle === "Monthly"
                          ? "1 Tháng (Hàng tháng)"
                          : order.billingCycle === "Quarterly"
                          ? "3 Tháng (Quý)"
                          : order.billingCycle === "SemiAnnual" || order.billingCycle === "HalfYearly"
                          ? "6 Tháng (Bán niên)"
                          : order.billingCycle === "Yearly"
                          ? "12 Tháng (Năm)"
                          : order.billingCycle === "Biennial"
                          ? "24 Tháng (2 Năm)"
                          : order.billingCycle}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Tổng giá trị</span>
                      <span className="font-black text-blue-600 mt-0.5 block">
                        {formatPrice(order.price || order.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Ngày khởi tạo</span>
                      <span className="font-semibold text-slate-700 mt-0.5 block">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Cam kết dịch vụ</span>
                      <span className="text-emerald-600 font-bold mt-0.5 block">SLA 99.9% Uptime</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800">Ghi chú kỹ thuật:</span> {order.notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Người nhận: <strong className="text-slate-800">{order.customerName}</strong>
                  </span>
                  <Link
                    href={`/order?planId=${order.planPriceId || order.planId || ""}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Gia Hạn / Nâng Cấp</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
