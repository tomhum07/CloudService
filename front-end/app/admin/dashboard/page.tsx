"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>({
    totalRevenue: 85250000,
    monthlyRevenue: 24500000,
    totalOrders: 1280,
    pendingOrders: 14,
    activeAffiliates: 142,
    monthlyOrders: [],
    popularPlans: []
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([
    { id: "ORD-94812", client: "Nguyễn Văn Hùng", service: "VPS Pro", amount: "150.000đ", status: "Hoàn tất", date: "Hôm nay, 14:32" },
    { id: "ORD-20491", client: "Lê Văn Tám", service: "Hosting Business", amount: "85.000đ", status: "Chờ duyệt", date: "Hôm nay, 11:15" },
    { id: "ORD-30194", client: "Phạm Minh Đức", service: "VPS Starter", amount: "90.000đ", status: "Hoàn tất", date: "Hôm qua, 18:40" },
    { id: "ORD-58102", client: "Trần Thị Lan", service: "VPS Enterprise", amount: "320.000đ", status: "Đã hủy", date: "15/08/2026" }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
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
      console.warn("Using default stats dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(val);
  };

  const stats = [
    { 
      label: "Doanh thu tháng này", 
      value: formatCurrency(statsData.monthlyRevenue || 24500000), 
      change: "+12.5%", 
      isPositive: true, 
      icon: "💰" 
    },
    { 
      label: "Tổng số đơn hàng", 
      value: (statsData.totalOrders || 1280).toLocaleString(), 
      change: `+${statsData.pendingOrders || 5} mới`, 
      isPositive: true, 
      icon: "🛒" 
    },
    { 
      label: "Cộng tác viên hoạt động", 
      value: `${statsData.activeAffiliates || 142} CTV`, 
      change: "+15.2%", 
      isPositive: true, 
      icon: "👥" 
    },
    { 
      label: "Uptime hệ thống", 
      value: "99.99%", 
      change: "Ổn định", 
      isPositive: true, 
      icon: "🛡️" 
    }
  ];

  const popularPlans = (statsData.popularPlans && statsData.popularPlans.length > 0)
    ? statsData.popularPlans
    : [
        { planName: "Cloud VPS Pro", orderCount: 482, percentage: 55 },
        { planName: "Cloud Hosting NVMe", orderCount: 284, percentage: 32 },
        { planName: "Tên Miền (Domain)", orderCount: 85, percentage: 9 },
        { planName: "Firewall & SSL", orderCount: 35, percentage: 4 }
      ];

  const colors = ["bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-purple-600", "bg-slate-500"];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Hệ Thống Quản Trị CloudAdmin</h1>
        <p className="text-xs text-slate-400 mt-1">Tổng quan hoạt động kinh doanh hạ tầng đám mây</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="text-xl font-extrabold text-white">{stat.value}</div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className={stat.isPositive ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {stat.change}
                </span>
                <span className="text-slate-500">so với tháng trước</span>
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
              <h3 className="text-sm font-bold text-white">Doanh Thu & Biến Động Đơn Hàng</h3>
              <p className="text-[10px] text-slate-400">Thống kê theo 6 tháng gần nhất</p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">Cập nhật tự động</span>
          </div>

          {/* SVG Line Chart */}
          <div className="h-64 w-full relative">
            <svg className="w-full h-full text-slate-800" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="0" y1="190" x2="500" y2="190" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Chart Path Line */}
              <path
                d="M 30,150 L 110,130 L 190,110 L 270,70 L 350,90 L 470,40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              <circle cx="30" cy="150" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <circle cx="110" cy="130" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <circle cx="190" cy="110" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <circle cx="270" cy="70" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <circle cx="350" cy="90" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
              <circle cx="470" cy="40" r="4.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />

              {/* Labels */}
              <text x="30" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 3</text>
              <text x="110" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 4</text>
              <text x="190" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 5</text>
              <text x="270" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 6</text>
              <text x="350" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 7</text>
              <text x="470" y="180" fill="#94a3b8" fontSize="9" textAnchor="middle">Tháng 8</text>

              {/* Y Axis Value Labels */}
              <text x="5" y="35" fill="#64748b" fontSize="8">100 Tr</text>
              <text x="5" y="85" fill="#64748b" fontSize="8">75 Tr</text>
              <text x="5" y="135" fill="#64748b" fontSize="8">50 Tr</text>
              <text x="5" y="185" fill="#64748b" fontSize="8">25 Tr</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Popular Services breakdown (Horizontal Progress bars) */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white">Dịch Vụ Phổ Biến</h3>
            <p className="text-[10px] text-slate-400">Tỷ lệ đơn hàng đăng ký theo gói</p>
          </div>

          <div className="space-y-5">
            {popularPlans.map((srv: any, idx: number) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{srv.planName}</span>
                  <span className="text-slate-500">{srv.orderCount} đơn ({srv.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full ${colors[idx % colors.length]}`} style={{ width: `${Math.max(srv.percentage, 5)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-6">Đơn Hàng Gần Đây</h3>
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
              {recentOrders.map((ord, idx) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
