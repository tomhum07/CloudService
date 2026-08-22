"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

const FEATURES_HIGHLIGHT = [
  {
    iconType: "cpu",
    title: "100% Ổ Cứng NVMe Enterprise",
    desc: "Sử dụng dòng ổ cứng NVMe chuyên dụng cho trung tâm dữ liệu, mang lại tốc độ đọc/ghi IOPS vượt trội gấp 10 lần SSD thông thường."
  },
  {
    iconType: "shield",
    title: "Tường Lửa Chống DDoS Độc Quyền",
    desc: "Hệ thống Anti-DDoS Firewall đa tầng Layer 3, 4 và 7 tự động nhận diện và lọc sạch các đợt tấn công SYN Flood, UDP Flood, HTTP Request Flood."
  },
  {
    iconType: "server",
    title: "Hạ Tầng Datacenter Tier 3 Quốc Tế",
    desc: "Cụm máy chủ đặt tại các trung tâm dữ liệu đạt chuẩn Quốc tế TIA-942 Rated 3 tại Hà Nội và TP.HCM với cam kết 99.99% Uptime."
  },
  {
    iconType: "backup",
    title: "Tự Động Sao Lưu (Daily Backup)",
    desc: "Dữ liệu của bạn luôn an toàn với cơ chế Backup tự động hàng ngày độc lập ra cụm Storage ngoài và hỗ trợ khôi phục Snapshot 1-Click."
  },
  {
    iconType: "support",
    title: "Hỗ Trợ Kỹ Thuật 24/7/365",
    desc: "Đội ngũ chuyên gia hệ thống túc trực 24/7 qua Ticket, Hotline và LiveChat với thời gian phản hồi trung bình dưới 5 phút."
  },
  {
    iconType: "refund",
    title: "Hoàn Tiền 100% Trong 30 Ngày",
    desc: "Cam kết hoàn lại 100% chi phí trong vòng 30 ngày nếu chất lượng dịch vụ không đáp ứng được kỳ vọng của quý khách hàng."
  }
];

const PREVIEW_TESTIMONIALS = [
  {
    name: "Nguyễn Phương Kiệt",
    role: "Trưởng phòng Phòng ANM và PCTPSDCNC",
    company: "Công An bên CAM 😁",
    comment: "Cloud VPS NVMe cực nhanh, website ĐÀO LỬA của chúng tôi chạy mượt mà, ngay cả trong các đợt điều tra.",
    avatar: "https://mttqkipzgbvikmneipqc.supabase.co/storage/v1/object/public/CLOUDSERVICCl_img/uploads/24e28da0bdea8c4f01f1c6fce73d653d.jpg?w=120&auto=format&fit=crop&q=80"
  },
  {
    name: "Lê Minh Trọng",
    role: "Developer",
    company: "Web xem phim lậu Phimme",
    comment: "Tường lửa WAF tự động ngăn chặn hoàn toàn các cuộc tấn công DDoS botnet mà không làm tăng độ trễ truy cập của khách hàng.",
    avatar: "https://mttqkipzgbvikmneipqc.supabase.co/storage/v1/object/public/CLOUDSERVICCl_img/uploads/1787424247618_5974007531177142723_5974007531177142723_7d8b272ee70ff03a327466c4673d70e4.jpg?w=120&auto=format&fit=crop&q=80"
  },
  {
    name: "Trùm DevOps",
    role: "DevOps Engineer",
    company: "Web xem phim lậu Phimme",
    comment: "Domain bên này nhiều, bị chặn cái là đổi sang domain khác, không lo bị mất khách hàng.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
  }
];

function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case "cpu":
      return (
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      );
    case "shield":
      return (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      );
    case "server":
      return (
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        </div>
      );
    case "backup":
      return (
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    case "support":
      return (
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      );
    case "refund":
    default:
      return (
        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
      );
  }
}

export default function Home() {
  const [plans, setPlans] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "vps" | "hosting" | "security">("all");
  const [selectedQrPlan, setSelectedQrPlan] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Plans
      try {
        const plansRes = await apiFetch("/api/service-plans?pageSize=50");
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const rawItems = plansData.items || plansData;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const items = rawItems.filter((p: any) => p.isActive !== false);
            const enriched = items.slice(0, 8).map((p: any) => {
              const prices = p.prices || [];
              const activePrice = prices[0];
              return {
                ...p,
                price: activePrice
                  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activePrice.price)
                  : "Liên hệ",
                unit: activePrice ? (activePrice.billingCycle === "Yearly" ? "năm" : "tháng") : "tháng"
              };
            });
            setPlans(enriched);
          } else {
            setPlans([]);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu plans:", err);
      }

      // 2. Fetch Latest News (Sorted Newest First)
      try {
        const newsRes = await apiFetch("/api/news?pageSize=50");
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const rawItems = newsData.items || newsData;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const activeNews = rawItems.filter((n: any) => n.isActive !== false);
            const sortedNews = [...activeNews].sort((a: any, b: any) => {
              const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
              const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
              return dateB - dateA; // Newest first
            });
            setNews(sortedNews.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Lỗi lấy tin tức:", err);
      }

      // 3. Fetch Active Promotions (Lọc mã hết hạn)
      try {
        const promoRes = await apiFetch("/api/promotions?activeOnly=true");
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          if (Array.isArray(promoData) && promoData.length > 0) {
            const now = Date.now();
            const activePromos = promoData.filter((pr: any) => {
              if (pr.isActive === false) return false;
              const start = pr.startDate ? new Date(pr.startDate).getTime() : 0;
              const end = pr.endDate ? new Date(pr.endDate).getTime() : Infinity;
              return now >= start && now <= end;
            });
            setPromotions(activePromos);
          } else {
            setPromotions([]);
          }
        } else {
          setPromotions([]);
        }
      } catch {
        setPromotions([]);
      }

      setLoading(false);
    }

    fetchData();

    // Lắng nghe SignalR để cập nhật tức thì khi Admin thêm/sửa/xóa gói, danh mục hoặc khuyến mãi
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "category" || entity === "price" || entity === "promotion" || entity === "all") {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (activeTab === "all") return true;
    const cat = (p.categoryName || "").toLowerCase();
    if (activeTab === "vps") return cat.includes("vps") || cat.includes("máy chủ");
    if (activeTab === "hosting") return cat.includes("host") || cat.includes("web");
    if (activeTab === "security") return cat.includes("firewall") || cat.includes("ssl") || cat.includes("email") || cat.includes("tên miền");
    return true;
  });

  return (
    <div className="space-y-16 sm:space-y-24 bg-slate-50 min-h-screen">
      
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>HẠ TẦNG CLOUD THẾ HỆ MỚI • UPTIME 99.99%</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Nền Tảng Điện Toán Đám Mây <br className="hidden sm:inline" />
                <span className="text-blue-600">Tốc Độ Cao &amp; Bảo Mật</span>
              </h1>

              <p className="text-base text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Giải pháp máy chủ ảo Cloud VPS NVMe, Web Hosting doanh nghiệp, Tên miền và Tường lửa chống DDoS đa tầng. Tối ưu hiệu năng ứng dụng với độ trễ dưới 2ms.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/pricing"
                  className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <span>Xem Bảng Giá &amp; Đặt Mua</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  href="/customers"
                  className="px-7 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Khách Hàng &amp; Đánh Giá
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl font-black text-slate-900 font-mono">99.99%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Uptime Cam Kết SLA</div>
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 font-mono">100%</div>
                  <div className="text-[11px] text-slate-500 font-medium">Ổ Cứng NVMe Gen4</div>
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 font-mono">24/7/365</div>
                  <div className="text-[11px] text-slate-500 font-medium">Hỗ Trợ Kỹ Thuật</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Tech Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">datacenter-node-01.vn</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Trạng Thái Hệ Thống</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Đang Hoạt Động (Normal)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Tốc Độ Đọc/Ghi NVMe</span>
                    <span className="text-blue-400 font-bold">7.200 MB/s (Gen4)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Dung Lượng Anti-DDoS</span>
                    <span className="text-purple-400 font-bold">100 Gbps Multi-Layer</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-400">Cổng Thanh Toán PayOS QR</span>
                    <span className="text-amber-300 font-bold">Kích Hoạt Tức Thì (1-Click)</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/order"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/30"
                  >
                    <span>Khởi Tạo Máy Chủ Của Bạn Ngay →</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CHẠY (HOT DEALS - YÊU CẦU ĐỀ BÀI) */}
      {promotions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                  <span>🔥 ƯU ĐÃI ĐANG DIỄN RA</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Chương Trình Khuyến Mãi &amp; Giảm Giá Đặc Biệt
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  Áp dụng giảm giá trực tiếp khi đặt mua các gói Cloud VPS, Hosting và Combo Tên miền ngay hôm nay.
                </p>
              </div>

              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shrink-0 shadow-md transition-colors"
              >
                Nhận Khuyến Mãi Ngay →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 relative z-10">
              {promotions.map((pr) => (
                <div
                  key={pr.id}
                  className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-white">{pr.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                        -{pr.discountPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 leading-relaxed line-clamp-2">
                      {pr.description || `Giảm ngay ${pr.discountPercentage}% giá trị gói cước cho tất cả chu kỳ thanh toán.`}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/15 flex justify-between items-center text-[11px]">
                    <span className="text-amber-300 font-semibold">Khuyến mãi có hạn</span>
                    <Link href="/pricing" className="text-white font-bold hover:underline">
                      Áp dụng →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. FEATURED SERVICES & PLANS (GÓI DỊCH VỤ NỔI BẬT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Bảng Giá Tốt Nhất</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Gói Dịch Vụ Nổi Bật
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab("vps")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "vps" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cloud VPS NVMe
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "hosting" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hosting LiteSpeed
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "security" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tên Miền &amp; An Ninh
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlans.map((plan: any) => (
            <div
              key={plan.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {plan.categoryName || "Dịch vụ"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>

                <div className="text-2xl font-black text-blue-600 mb-4">
                  {plan.price}{" "}
                  <span className="text-xs text-slate-400 font-normal">/ {plan.unit || "tháng"}</span>
                </div>

                {/* QR Code Thumbnail */}
                {plan.qrCodeUrl && (
                  <div
                    onClick={() => setSelectedQrPlan(plan)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl mb-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 group/qr shadow-xs"
                    title="Bấm để phóng to mã QR quét trên điện thoại"
                  >
                    <div className="relative shrink-0 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={plan.qrCodeUrl}
                        alt={`QR Code ${plan.name}`}
                        className="w-12 h-12 object-contain rounded-lg group-hover/qr:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 group-hover/qr:text-blue-600 transition-colors">
                        <span>Quét QR Mua Nhanh</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        Chạm để phóng to mã QR
                      </p>
                    </div>
                  </div>
                )}

                {/* Specs Table */}
                <div className="py-3 my-3 border-t border-b border-slate-100 space-y-2 text-xs">
                  {plan.cpu && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500 font-medium">Vi xử lý (CPU)</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.cpu}</span>
                    </div>
                  )}
                  {plan.ram && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500 font-medium">Bộ nhớ (RAM)</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.ram}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500 font-medium">Lưu trữ (Disk)</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.storage}</span>
                    </div>
                  )}
                  {plan.bandwidth && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500 font-medium">Băng thông</span>
                      <span className="font-semibold text-slate-900">{plan.bandwidth}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href={`/order?planId=${plan.id}`}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-md shadow-blue-500/20"
                >
                  Đăng Ký Gói Này →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL PHÓNG TO MÃ QR KHỔ LỚN TRÊN TRANG CHỦ */}
      {selectedQrPlan && (
        <div
          onClick={() => setSelectedQrPlan(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {selectedQrPlan.categoryName || "Gói Dịch Vụ"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedQrPlan(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">{selectedQrPlan.name}</h3>
            <p className="text-xs text-slate-500 mb-5">
              Quét mã bằng Camera điện thoại hoặc Zalo để chuyển thẳng đến trang đăng ký &amp; thanh toán
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-5 inline-block shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedQrPlan.qrCodeUrl}
                alt={`QR Code ${selectedQrPlan.name}`}
                className="w-56 h-56 mx-auto rounded-xl shadow-xs bg-white p-3 border border-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Link
                href={`/order?planId=${selectedQrPlan.id}`}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>🔗 Mở Trang Đặt Mua Ngay</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedQrPlan(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANTI-DDOS FIREWALL SPOTLIGHT */}
      <section className="bg-white border-y border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 mb-4">
                <span>CÔNG NGHỆ BẢO MẬT ĐỘC QUYỀN</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                Tường Lửa Anti-DDoS Đa Tầng <br />
                <span className="text-blue-600">Bảo Vệ Website Luôn Online</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Hệ thống lọc lưu lượng thông minh kết hợp giữa phần cứng chuyên dụng và thuật toán AI nhận diện bất thường, giúp triệt tiêu hoàn toàn các đợt tấn công từ chối dịch vụ quy mô lớn mà không gây gián đoạn hay tăng độ trễ cho người dùng thật.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lớp Lọc Mạng Layer 3 &amp; 4 (100Gbps+)</h4>
                    <p className="text-[11px] text-slate-500">Chặn đứng các cuộc tấn công SYN Flood, UDP Amplification, ICMP Flood ở mức hạ tầng mạng.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lớp Lọc Ứng Dụng Web WAF Layer 7</h4>
                    <p className="text-[11px] text-slate-500">Phân tích hành vi HTTP/HTTPS Request, phát hiện botnet cào dữ liệu và chống brute-force.</p>
                  </div>
                </div>
              </div>

              <Link
                href="/services/firewall-anti-ddos"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                Tìm Hiểu Thêm Về Tường Lửa →
              </Link>
            </div>

            {/* Visual Box */}
            <div className="p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center pb-4 mb-5 border-b border-white/10">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI TRAFFIC FILTER LIVE MONITOR
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Latency &lt; 1.2ms</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-300">SYN Flood Attack (35 Gbps)</span>
                  <span className="text-emerald-400 font-bold">100% Mitigated</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-300">UDP Reflection (50 Gbps)</span>
                  <span className="text-emerald-400 font-bold">100% Mitigated</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-300">HTTP GET Flood (1.2M Req/s)</span>
                  <span className="text-emerald-400 font-bold">WAF Blocked</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/50 flex justify-between items-center">
                  <span className="text-blue-300 font-bold">Clean Traffic to Server</span>
                  <span className="text-blue-400 font-bold">2.4 Gbps (Online)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. KHÁCH HÀNG & ĐÁNH GIÁ TIÊU BIỂU (TESTIMONIALS SNIPPET) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Khách Hàng Nói Về Chúng Tôi</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trải Nghiệm Khách Hàng Tiêu Biểu</h2>
          </div>
          <Link href="/customers" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            Xem Tất Cả Đánh Giá &amp; Đối Tác →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PREVIEW_TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.role} • {t.company}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>
              <div className="text-amber-400 text-xs pt-3 mt-3 border-t border-slate-100">
                ★★★★★
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. LATEST NEWS & KNOWLEDGE BASE (TIN TỨC MỚI NHẤT) */}
      {news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Tin Tức &amp; Blog</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Tin Tức &amp; Kiến Thức Mới Nhất</h2>
            </div>
            <Link href="/news" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Xem Tất Cả Bài Viết →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item: any) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all block group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 inline-block">
                    {item.categoryName || item.category || "Tin Tức"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("vi-VN") : "Mới nhất"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {item.summary || item.content}
                </p>
                <span className="text-xs font-bold text-blue-600 group-hover:underline">
                  Đọc tiếp →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. WHY CHOOSE US (FEATURES GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Ưu Thế Vượt Trội</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lý Do Khách Hàng Tin Chọn CloudService
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES_HIGHLIGHT.map((f, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all shadow-xs group"
            >
              <FeatureIcon type={f.iconType} />
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. CALL TO ACTION STRIP */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black mb-3 tracking-tight">
            Sẵn Sàng Nâng Tầm Hạ Tầng Cho Doanh Nghiệp Của Bạn?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Đăng ký tài khoản ngay hôm nay để nhận ưu đãi giảm 20% cho đơn hàng đầu tiên cùng dịch vụ hỗ trợ chuyển dữ liệu miễn phí.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/order"
              className="px-8 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-lg shadow-blue-900/30"
            >
              Khởi Tạo Dịch Vụ Ngay
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white border border-blue-400 font-bold text-xs transition-colors"
            >
              Xem Bảng Giá Chi Tiết
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
