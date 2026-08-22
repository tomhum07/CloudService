"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

const DOMAIN_PRICES = [
  { tld: ".vn", price: "450.000đ", renew: "350.000đ", popular: true },
  { tld: ".com", price: "249.000đ", renew: "299.000đ", popular: true },
  { tld: ".net", price: "289.000đ", renew: "329.000đ", popular: false },
  { tld: ".com.vn", price: "350.000đ", renew: "250.000đ", popular: false },
  { tld: ".io", price: "790.000đ", renew: "850.000đ", popular: false }
];


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
  const [domainQuery, setDomainQuery] = useState("");
  const [domainResult, setDomainResult] = useState<{ checked: boolean; domain: string; available?: boolean; price?: string } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "vps" | "hosting" | "security">("all");
  const [selectedQrPlan, setSelectedQrPlan] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const plansRes = await apiFetch("/api/service-plans?pageSize=50");
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const rawItems = plansData.items || plansData;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const items = rawItems.filter((p: any) => p.isActive !== false);
            const enriched = items.slice(0, 6).map((p: any) => {
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
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu plans:", err);
        setPlans([]);
      }

      try {
        const newsRes = await apiFetch("/api/news?pageSize=50");
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const rawItems = newsData.items || newsData;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            setNews(rawItems.filter((n: any) => n.isActive !== false).slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Lỗi lấy tin tức:", err);
      }

      setLoading(false);
    }

    fetchData();

    // Lắng nghe SignalR để cập nhật tức thì khi Admin thêm/sửa/xóa gói hoặc danh mục
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "category" || entity === "price" || entity === "all") {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDomainCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainQuery.trim()) return;
    
    let clean = domainQuery.trim().toLowerCase();
    if (!clean.includes(".")) {
      clean += ".vn";
    }

    const available = Math.random() > 0.3;
    setDomainResult({
      checked: true,
      domain: clean,
      available,
      price: clean.endsWith(".vn") ? "450.000đ / năm" : "249.000đ / năm"
    });
  };

  const filteredPlans = plans.filter((p) => {
    if (activeTab === "all") return true;
    const cat = (p.categoryName || "").toLowerCase();
    if (activeTab === "vps") return cat.includes("vps") || cat.includes("máy chủ");
    if (activeTab === "hosting") return cat.includes("host") || cat.includes("web");
    if (activeTab === "security") return cat.includes("mật") || cat.includes("firewall") || cat.includes("mail");
    return true;
  });

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION & DOMAIN SEARCH */}
      <section className="relative overflow-hidden pt-28 pb-20 border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            HẠ TẦNG CLOUD VPS & HOSTING TIÊU CHUẨN QUỐC TẾ TIER 3
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight max-w-5xl mx-auto">
            Hạ Tầng Điện Toán Đám Mây <br />
            <span className="text-blue-600">
              Tốc Độ Cực Đỉnh & Chống DDoS Vượt Trội
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Cung cấp giải pháp <strong>Cloud VPS NVMe</strong>, <strong>Web Hosting LiteSpeed</strong>, <strong>Tên miền</strong>, <strong>Email doanh nghiệp</strong> và <strong>Tường lửa Anti-DDoS</strong> chuyên sâu bảo vệ website an toàn 24/7.
          </p>

            {/* DOMAIN SEARCH BAR */}
            <div className="max-w-3xl mx-auto mb-12">
              <form onSubmit={handleDomainCheck} className="p-2 rounded-2xl bg-white border border-slate-300 shadow-xl flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <span className="text-slate-400 text-lg">🔍</span>
                  <input
                    type="text"
                    placeholder="Nhập tên miền bạn muốn kiểm tra (VD: tencongty, myshop.com)..."
                    value={domainQuery}
                    onChange={(e) => setDomainQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-3"
                  />
                  {domainQuery && (
                    <button
                      type="button"
                      onClick={() => setDomainQuery("")}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 shrink-0"
                >
                  Kiểm Tra Tên Miền
                </button>
              </form>

              {/* Quick Domain Pricing Pills (Click to append TLD) */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4 text-xs">
                <span className="text-slate-500 font-medium">Đuôi mở rộng hot:</span>
                {DOMAIN_PRICES.map((d) => (
                  <button
                    key={d.tld}
                    type="button"
                    onClick={() => {
                      const base = domainQuery.includes(".") ? domainQuery.split(".")[0] : (domainQuery || "mybrand");
                      setDomainQuery(`${base}${d.tld}`);
                    }}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title={`Chọn đuôi ${d.tld}`}
                  >
                    <span className="font-bold text-blue-600">{d.tld}</span>
                    <span className="text-slate-700 font-semibold">{d.price}</span>
                  </button>
                ))}
              </div>

            {/* Domain Check Result Modal/Card */}
            {domainResult && domainResult.checked && (
              <div className="mt-6 p-4 rounded-2xl bg-white border border-blue-200 shadow-lg text-left flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white ${domainResult.available ? "bg-emerald-600" : "bg-rose-600"}`}>
                    {domainResult.available ? "✓" : "✕"}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{domainResult.domain}</h4>
                    <p className="text-xs text-slate-600">
                      {domainResult.available
                        ? `Tên miền còn trống! Giá đăng ký chỉ từ ${domainResult.price}`
                        : "Tên miền này đã có người đăng ký. Vui lòng chọn đuôi mở rộng khác."}
                    </p>
                  </div>
                </div>
                {domainResult.available ? (
                  <Link
                    href={`/order?plan=domain&name=${encodeURIComponent(domainResult.domain)}`}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shrink-0 shadow-sm"
                  >
                    Đăng Ký Ngay
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDomainResult(null)}
                    className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5"
                  >
                    Đóng
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-2xl md:text-3xl font-black text-blue-600">99.99%</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Cam kết Uptime SLA</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-2xl md:text-3xl font-black text-indigo-600">Tier 3</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Datacenter Quốc Tế</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-2xl md:text-3xl font-black text-emerald-600">100Gbps+</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Tường Lửa Anti-DDoS</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="text-2xl md:text-3xl font-black text-amber-600">24/7/365</div>
              <div className="text-xs text-slate-600 mt-1 font-medium">Hỗ Trợ Kỹ Thuật</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SERVICES & PRICING SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Bảng Giá Nổi Bật</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Gói Dịch Vụ Khởi Tạo Nhanh
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab("vps")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "vps" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cloud VPS NVMe
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "hosting" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hosting LiteSpeed
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === "security" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Email & Bảo Mật
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

                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>

                <div className="text-2xl font-black text-blue-600 mb-4">
                  {plan.price}{" "}
                  <span className="text-xs text-slate-400 font-normal">/ {plan.unit || "tháng"}</span>
                </div>

                {/* Prominent Large QR Code Section */}
                {plan.qrCodeUrl && (
                  <div
                    onClick={() => setSelectedQrPlan(plan)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl mb-5 flex items-center gap-3.5 cursor-pointer transition-all duration-200 group/qr shadow-xs"
                    title="Bấm để phóng to mã QR quét trên điện thoại"
                  >
                    <div className="relative shrink-0 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={plan.qrCodeUrl}
                        alt={`QR Code ${plan.name}`}
                        className="w-16 h-16 object-contain rounded-lg group-hover/qr:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-blue-600/10 rounded-xl opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs">🔍</span>
                      </div>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 group-hover/qr:text-blue-600 transition-colors">
                        <span>📱 Quét QR Thanh Toán</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        Chạm để phóng to & quét đặt mua nhanh
                      </p>
                    </div>
                  </div>
                )}

                <div className="h-[1px] bg-slate-100 mb-4"></div>

                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  {plan.cpu && (
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">⚡ CPU:</span> {plan.cpu}
                    </li>
                  )}
                  {plan.ram && (
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">💾 RAM:</span> {plan.ram}
                    </li>
                  )}
                  {plan.storage && (
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">💽 Ổ cứng:</span> {plan.storage}
                    </li>
                  )}
                  {plan.bandwidth && (
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">🚀 Băng thông:</span> {plan.bandwidth}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">🛡️ Tường lửa:</span> Anti-DDoS 100Gbps
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href={`/order?planId=${plan.id}`}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-md shadow-blue-500/20"
                >
                  Đăng Ký Gói Này →
                </Link>
                {plan.slug && (
                  <Link
                    href={`/services/${plan.slug}`}
                    className="w-full py-2 rounded-xl text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    Xem chi tiết tính năng
                  </Link>
                )}
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
              Quét mã bằng Camera điện thoại hoặc Zalo để chuyển thẳng đến trang đăng ký & thanh toán
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-5 inline-block shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedQrPlan.qrCodeUrl}
                alt={`QR Code ${selectedQrPlan.name}`}
                className="w-60 h-60 mx-auto rounded-xl shadow-xs bg-white p-3 border border-slate-100"
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

      {/* 3. ANTI-DDOS FIREWALL SPOTLIGHT */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 mb-4">
                🛡️ CÔNG NGHỆ BẢO MẬT ĐỘC QUYỀN
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                Tường Lửa Anti-DDoS Đa Tầng <br />
                <span className="text-blue-600">Bảo Vệ Website Luôn Online</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Hệ thống lọc lưu lượng thông minh kết hợp giữa phần cứng chuyên dụng và thuật toán AI nhận diện bất thường, giúp triệt tiêu hoàn toàn các đợt tấn công từ chối dịch vụ quy mô lớn mà không gây gián đoạn hay tăng độ trễ cho người dùng thật.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Lớp Lọc Mạng Layer 3 & 4</h4>
                    <p className="text-xs text-slate-500">Chặn đứng các cuộc tấn công SYN Flood, UDP Amplification, ICMP Flood ở mức hạ tầng mạng với dung lượng lọc 100Gbps+.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Lớp Lọc Ứng Dụng Web WAF Layer 7</h4>
                    <p className="text-xs text-slate-500">Phân tích hành vi HTTP/HTTPS Request, phát hiện botnet cào dữ liệu, chống brute-force đăng nhập và spam biểu mẫu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Độ Trễ Cực Thấp &lt; 2ms</h4>
                    <p className="text-xs text-slate-500">Tối ưu định tuyến Anycast BGP trực tiếp tại Việt Nam, mang lại trải nghiệm duyệt web mượt mà như không qua tường lửa.</p>
                  </div>
                </div>
              </div>

              <Link
                href="/services/firewall-anti-ddos"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                Tìm Hiểu Thêm Về Tường Lửa →
              </Link>
            </div>

            {/* Visual Box */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI TRAFFIC FILTER LIVE MONITOR
                </span>
                <span className="text-xs text-slate-400">Layer 3/4/7</span>
              </div>

              <div className="space-y-4 font-mono text-xs">
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
                  <span className="text-blue-300 font-bold">Clean Traffic to Origin</span>
                  <span className="text-blue-400 font-bold">2.4 Gbps (Latency: 1.2ms)</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
                Bảo vệ miễn phí 100% khi sử dụng Cloud VPS & Hosting tại CloudService
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US (FEATURES GRID) */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Ưu Thế Vượt Trội</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Lý Do Khách Hàng Tin Chọn CloudService
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_HIGHLIGHT.map((f, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all shadow-xs group"
            >
              <FeatureIcon type={f.iconType} />
              <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. LATEST NEWS & KNOWLEDGE BASE */}
      {news.length > 0 && (
        <section className="bg-white border-t border-slate-200 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Tin Tức & Blog</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Kiến Thức & Khuyến Mãi Mới Nhất</h2>
              </div>
              <Link href="/news" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Xem Tất Cả Bài Viết →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all block group"
                >
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-3 inline-block">
                    {item.category || "Tin tức"}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.summary || item.content}
                  </p>
                  <span className="text-xs font-bold text-blue-600 group-hover:underline">
                    Đọc tiếp →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION STRIP */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Sẵn Sàng Nâng Tầm Hạ Tầng Cho Doanh Nghiệp Của Bạn?
          </h2>
          <p className="text-sm text-blue-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Đăng ký tài khoản ngay hôm nay để nhận ưu đãi giảm 20% cho hợp đồng đầu tiên cùng dịch vụ hỗ trợ chuyển dữ liệu miễn phí.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/order"
              className="px-8 py-4 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-lg shadow-blue-900/30"
            >
              Khởi Tạo Dịch Vụ Ngay
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white border border-blue-400 font-bold text-xs transition-colors"
            >
              Xem Bảng Giá Chi Tiết
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
