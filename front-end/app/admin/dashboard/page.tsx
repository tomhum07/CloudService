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
      label: "Doanh thu tháng này", 
      value: formatCurrency(statsData.monthlyRevenue || 0), 
      change: statsData.totalRevenue > 0 ? `Tổng: ${formatCurrency(statsData.totalRevenue)}` : "Chưa có doanh thu", 
      isPositive: true, 
      icon: "💰" 
    },
    { 
      label: "Tổng số đơn hàng", 
      value: (statsData.totalOrders || 0).toLocaleString(), 
      change: statsData.pendingOrders > 0 ? `${statsData.pendingOrders} đơn chờ duyệt` : "Tất cả đã xử lý", 
      isPositive: statsData.pendingOrders === 0, 
      icon: "🛒" 
    },
    { 
      label: "Đối tác CTV hoạt động", 
      value: `${statsData.activeAffiliates || 0} CTV`, 
      change: `Tổng ${statsData.totalUsers || 0} tài khoản`, 
      isPositive: true, 
      icon: "👥" 
    },
    { 
      label: "Gói cước hoạt động", 
      value: `${statsData.totalPlans || 0} gói dịch vụ`, 
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
        { planName: "Cloud VPS Pro", orderCount: 0, percentage: 0 },
        { planName: "Cloud Hosting NVMe", orderCount: 0, percentage: 0 },
        { planName: "Tên Miền (Domain)", orderCount: 0, percentage: 0 }
      ];

  const colors = ["bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-purple-600", "bg-slate-500"];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hệ Thống Quản Trị CloudAdmin</h1>
          <p className="text-xs text-slate-400 mt-1">Dữ liệu thời gian thực được tổng hợp từ máy chủ đám mây</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>{loading ? "Đang tải..." : "Làm mới dữ liệu"}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="text-xl font-extrabold text-white">{stat.value}</div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className={stat.isPositive ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                  {stat.change}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-xl">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart 1: Revenue over months (Line graph representation) */}
        <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">Biến Động Doanh Thu 6 Tháng Qua</h3>
              <p className="text-[10px] text-slate-400">Đơn vị: VND (Dựa trên hóa đơn đã hoàn tất)</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">Dữ liệu thời gian thực</span>
          </div>

          {/* SVG Line Chart */}
          <div className="h-64 w-full relative">
            <svg className="w-full h-full text-slate-800" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Chart Path Line */}
              <path
                d={chartD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dynamic Data Points */}
              {chartPoints.map((pt: any, i: number) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#3b82f6"
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="hover:r-7 transition-all cursor-pointer"
                  >
                    <title>{`${pt.month}: ${formatCurrency(pt.val)} (${pt.orderCount} đơn)`}</title>
                  </circle>
                  <text x={pt.x} y="185" fill="#94a3b8" fontSize="9" textAnchor="middle">
                    {pt.month}
                  </text>
                </g>
              ))}

              {/* Y Axis Value Labels */}
              <text x="5" y="40" fill="#64748b" fontSize="8">{formatCurrency(maxVal)}</text>
              <text x="5" y="80" fill="#64748b" fontSize="8">{formatCurrency(maxVal * 0.66)}</text>
              <text x="5" y="120" fill="#64748b" fontSize="8">{formatCurrency(maxVal * 0.33)}</text>
              <text x="5" y="160" fill="#64748b" fontSize="8">0 đ</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Popular Services breakdown (Horizontal Progress bars) */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white">Dịch Vụ Được Quan Tâm</h3>
            <p className="text-[10px] text-slate-400">Tỷ lệ đơn đặt hàng theo từng gói cước</p>
          </div>

          <div className="space-y-5">
            {popularPlans.map((srv: any, idx: number) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 truncate max-w-[150px]">{srv.planName}</span>
                  <span className="text-slate-500">{srv.orderCount} đơn ({srv.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full ${colors[idx % colors.length]}`} style={{ width: `${Math.max(srv.percentage, 4)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-6">Đơn Hàng Mới Nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold">
                <th className="pb-3">Mã đơn</th>
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Dịch vụ</th>
                <th className="pb-3">Tổng tiền</th>
                <th className="pb-3">Trạng thái</th>
                <th className="pb-3">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-200">{ord.id}</td>
                    <td className="py-3.5">{ord.client}</td>
                    <td className="py-3.5">{ord.service}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-100">{ord.amount}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
