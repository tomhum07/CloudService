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
          const username = payload["sub"] || payload["name"] || "";
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

  const getStatusBadge = (status: number, statusName: string) => {
    switch (status) {
      case 2:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">🟢 Đang hoạt động</span>;
      case 1:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">⚙️ Đang xử lý</span>;
      case 3:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">🔴 Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🟡 Chờ kích hoạt</span>;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-28 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
              <span>📦</span> Cổng Dịch Vụ Khách Hàng
            </div>
            <h1 className="text-3xl font-extrabold text-white">Gói Cước & Dịch Vụ Của Tôi</h1>
            <p className="text-xs text-slate-400 mt-1">
              Theo dõi tình trạng máy chủ ảo, hosting, chu kỳ thanh toán và thông tin kỹ thuật
            </p>
          </div>

          <Link
            href="/order"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            + Đăng Ký Gói Mới
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/5">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Tìm theo mã đơn (ORD-...), tên gói cước..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động (Completed)</option>
              <option value="pending">Đang chờ xử lý / Chờ kích hoạt</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-24 text-center">
            <span className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
            <p className="text-xs text-slate-400 mt-3">Đang tải danh sách dịch vụ của bạn...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/50 rounded-2xl border border-white/5 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4">
              📭
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Chưa Có Gói Dịch Vụ Nào</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Bạn chưa đăng ký gói cước nào hoặc đơn hàng chưa được tạo. Hãy tham khảo bảng giá dịch vụ Cloud VPS & Hosting để bắt đầu.
            </p>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
            >
              Khám Phá Bảng Giá
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-400">{order.orderCode}</span>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mt-0.5">
                        {order.planName}
                      </h3>
                      <span className="text-[11px] text-slate-400">{order.categoryName}</span>
                    </div>
                    {getStatusBadge(order.status, order.statusName)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-white/5 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Chu kỳ</span>
                      <span className="font-semibold text-slate-300">
                        {order.billingCycle === "Monthly"
                          ? "1 Tháng (Monthly)"
                          : order.billingCycle === "Quarterly"
                          ? "3 Tháng (Quarterly)"
                          : order.billingCycle === "HalfYearly"
                          ? "6 Tháng (HalfYearly)"
                          : order.billingCycle === "Yearly"
                          ? "1 Năm (Yearly)"
                          : order.billingCycle}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Chi phí</span>
                      <span className="font-bold text-blue-400">{formatPrice(order.price)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Ngày đăng ký</span>
                      <span className="text-slate-300">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Hỗ trợ kỹ thuật</span>
                      <span className="text-emerald-400 font-semibold">24/7 SLA 99.9%</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-white/5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Ghi chú:</span> {order.notes}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <span className="text-[11px] text-slate-500">
                    Khách hàng: <strong className="text-slate-300">{order.customerName}</strong>
                  </span>
                  <Link
                    href={`/order?planId=${order.planPriceId}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Gia hạn / Nâng cấp</span>
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
