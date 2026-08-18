"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeAffiliates: 0,
    totalUsers: 0,
    totalPlans: 0,
    monthlyOrders: [],
    popularPlans: []
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Real Stats
      const statRes = await apiFetch("/api/statistics/dashboard");
      if (statRes.ok) {
        const data = await statRes.json();
        setStatsData(data);
      }

      // 2. Fetch Recent Orders
      const orderRes = await apiFetch("/api/order-requests?pageSize=5");
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const items = orderData.items || orderData;
        if (Array.isArray(items) && items.length > 0) {
          setRecentOrders(items.map((o: any) => ({
            id: o.orderCode || `ORD-${o.id}`,
            client: o.customerName,
            service: o.planName,
            amount: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(o.price || 0),
            status: o.statusName || (o.status === 2 ? "Hoàn tất" : o.status === 3 ? "Đã hủy" : "Chờ duyệt"),
            date: new Date(o.createdAt).toLocaleString("vi-VN")
          })));
        }
      }
    } catch (err) {
      console.warn("Lỗi tải số liệu thống kê:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(val || 0);
  };

  const stats = [
    { 
      label: "Doanh Thu Tháng Này", 
      value: formatCurrency(statsData.monthlyRevenue || 0), 
      change: statsData.totalRevenue > 0 ? `Tổng tích lũy: ${formatCurrency(statsData.totalRevenue)}` : "Chưa có doanh thu", 
      isPositive: true, 
      icon: "💰" 
    },
    { 
      label: "Tổng Số Đơn Hàng", 
      value: (statsData.totalOrders || 0).toLocaleString(), 
      change: statsData.pendingOrders > 0 ? `${statsData.pendingOrders} đơn chờ duyệt` : "Tất cả đã xử lý", 
      isPositive: statsData.pendingOrders === 0, 
      icon: "🛒" 
    },
    { 
      label: "Đối Tác CTV Hoạt Động", 
      value: `${statsData.activeAffiliates || 0} CTV`, 
      change: `Tổng ${statsData.totalUsers || 0} tài khoản`, 
      isPositive: true, 
      icon: "👥" 
    },
    { 
      label: "Gói Dịch Vụ Khả Dụng", 
      value: `${statsData.totalPlans || 0} Gói cước`, 
      change: "Uptime 99.99%", 
      isPositive: true, 
      icon: "🛡️" 
    }
  ];

  const monthlyOrders = (statsData.monthlyOrders && statsData.monthlyOrders.length > 0)
    ? statsData.monthlyOrders
    : [
        { month: "T3", orderCount: 0, revenue: 0 },
        { month: "T4", orderCount: 0, revenue: 0 },
        { month: "T5", orderCount: 0, revenue: 0 },
        { month: "T6", orderCount: 0, revenue: 0 },
        { month: "T7", orderCount: 0, revenue: 0 },
        { month: "T8", orderCount: 0, revenue: 0 }
      ];

  const maxVal = Math.max(...monthlyOrders.map((m: any) => m.revenue || (m.orderCount * 100000) || 0), 500000);

  const chartPoints = monthlyOrders.map((m: any, idx: number) => {
    const x = 40 + idx * ((460 - 40) / Math.max(monthlyOrders.length - 1, 1));
    const val = m.revenue || 0;
    const y = 160 - (maxVal > 0 ? (val / maxVal) * 120 : 0);
    return { x, y, ...m, val };
  });

  const chartD = chartPoints.length > 0
    ? `M ${chartPoints.map((p: any) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`
    : "M 40,160 L 460,160";

  const popularPlans = (statsData.popularPlans && statsData.popularPlans.length > 0)
    ? statsData.popularPlans
    : [
        { planName: "Cloud VPS NVMe", orderCount: 0, percentage: 0 },
        { planName: "Web Hosting NVMe", orderCount: 0, percentage: 0 },
        { planName: "Tên Miền (Domain)", orderCount: 0, percentage: 0 }
      ];

  const colors = ["bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-amber-600", "bg-slate-500"];

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Tổng Quan Hệ Thống Quản Trị</h1>
          <p className="text-xs text-slate-500 mt-1">Dữ liệu thời gian thực được đồng bộ từ trung tâm dữ liệu</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20"
        >
          <span>🔄</span>
          <span>{loading ? "Đang cập nhật..." : "Làm mới dữ liệu"}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className={stat.isPositive ? "text-emerald-600" : "text-amber-600"}>
                  {stat.change}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl border border-blue-100">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Biểu đồ Doanh thu & Đơn hàng */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Biểu Đồ Doanh Thu & Xu Hướng Đơn Hàng</h3>
              <p className="text-xs text-slate-500 mt-0.5">Biểu đồ thể hiện tăng trưởng theo các tháng gần nhất</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Năm {new Date().getFullYear()}
            </span>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              ))}

              {/* Area fill */}
              {chartPoints.length > 0 && (
                <path
                  d={`${chartD} L ${chartPoints[chartPoints.length - 1].x},160 L ${chartPoints[0].x},160 Z`}
                  fill="url(#blueGrad)"
                />
              )}

              {/* Line chart */}
              <path d={chartD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

              {/* Points */}
              {chartPoints.map((p: any, idx: number) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  <text x={p.x} y={p.y - 10} fill="#2563eb" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {p.val > 0 ? `${(p.val / 1000).toLocaleString()}k` : `${p.orderCount || 0} đơn`}
                  </text>
                  <text x={p.x} y="180" fill="#64748b" fontSize="11" textAnchor="middle">
                    {p.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Tỷ lệ dịch vụ phổ biến */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Cơ Cấu Dịch Vụ Ưa Chuộng</h3>
            <p className="text-xs text-slate-500 mb-6">Tỷ lệ các nhóm dịch vụ được đăng ký nhiều nhất</p>

            <div className="space-y-4">
              {popularPlans.map((item: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{item.planName}</span>
                    <span className="text-blue-600">{item.percentage || 0}% ({item.orderCount || 0} đơn)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[idx % colors.length]}`}
                      style={{ width: `${Math.max(item.percentage || 0, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-slate-600">
            <strong className="text-blue-900 block mb-1">💡 Gợi ý kinh doanh:</strong>
            Gói Cloud VPS NVMe và Web Hosting đang là sản phẩm có mức tăng trưởng doanh thu cao nhất.
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Đơn Hàng Gần Đây Cần Xử Lý</h3>
            <p className="text-xs text-slate-500 mt-0.5">Danh sách các yêu cầu đặt mua dịch vụ mới nhất</p>
          </div>
          <a
            href="/admin/orders"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Xem toàn bộ đơn hàng →
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            Chưa có đơn hàng mới nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Gói Dịch Vụ</th>
                  <th className="py-3 px-4">Giá Tiền</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{ord.client}</td>
                    <td className="py-3 px-4 text-slate-700">{ord.service}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{ord.amount}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-slate-500">{ord.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
