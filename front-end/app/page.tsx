"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

const DOMAIN_PRICES = [
  { tld: ".vn", price: "450.000đ", renew: "350.000đ", popular: true },
  { tld: ".com", price: "249.000đ", renew: "299.000đ", popular: true },
  { tld: ".net", price: "289.000đ", renew: "329.000đ", popular: false },
  { tld: ".com.vn", price: "350.000đ", renew: "250.000đ", popular: false },
  { tld: ".io", price: "790.000đ", renew: "850.000đ", popular: false }
];

const MOCK_SERVICES = [
  {
    id: 1,
    name: "Cloud VPS NVMe Pro",
    categoryName: "Cloud VPS",
    description: "Máy chủ ảo đám mây chuẩn Enterprise, bộ vi xử lý Intel Xeon Gold / AMD EPYC, ổ cứng NVMe Gen4 RAID 10 siêu tốc.",
    cpu: "2 vCPUs Dedicated",
    ram: "4 GB RAM ECC DDR4",
    storage: "60 GB Enterprise NVMe",
    bandwidth: "1 Gbps Không giới hạn",
    antiDDoS: "Tường lửa Anti-DDoS 100Gbps",
    price: "150.000đ",
    unit: "tháng"
  },
  {
    id: 2,
    name: "Cloud Hosting NVMe LiteSpeed",
    categoryName: "Cloud Hosting",
    description: "Hosting tốc độ cao tối ưu 100% WordPress & WooCommerce, tích hợp bộ nhớ đệm LSCache và bảo mật Imunify360 AI.",
    cpu: "2 Core CPU LiteSpeed",
    ram: "2 GB RAM",
    storage: "20 GB NVMe Storage",
    bandwidth: "Không giới hạn",
    antiDDoS: "Miễn phí SSL & WAF",
    price: "45.000đ",
    unit: "tháng"
  },
  {
    id: 3,
    name: "Email Doanh Nghiệp Pro",
    categoryName: "Email Doanh Nghiệp",
    description: "Hệ thống email theo tên miền riêng (@yourdomain.com), tỷ lệ vào Inbox 99.9%, tích hợp bộ lọc Antispam & Antivirus.",
    cpu: "Hạ tầng Mail Cluster",
    ram: "Không giới hạn tài khoản",
    storage: "50 GB Dung lượng Mail",
    bandwidth: "Gửi/Nhận siêu tốc",
    antiDDoS: "Bảo mật DKIM, SPF, DMARC",
    price: "99.000đ",
    unit: "tháng"
  },
  {
    id: 4,
    name: "Tường Lửa Anti-DDoS Firewall",
    categoryName: "Bảo Mật",
    description: "Giải pháp lọc sạch tấn công từ chối dịch vụ Layer 3/4/7 thời gian thực, bảo vệ hệ thống web app và API an toàn tuyệt đối.",
    cpu: "Dung lượng lọc 100Gbps+",
    ram: "Phân tích AI Layer 7",
    storage: "Báo cáo Real-time",
    bandwidth: "Độ trễ < 2ms",
    antiDDoS: "Bảo vệ IP chuyên dụng",
    price: "350.000đ",
    unit: "tháng"
  }
];

const FEATURES_HIGHLIGHT = [
  {
    icon: "⚡",
    title: "100% Ổ Cứng NVMe Enterprise",
    desc: "Sử dụng dòng ổ cứng NVMe chuyên dụng cho trung tâm dữ liệu, mang lại tốc độ đọc/ghi IOPS vượt trội gấp 10 lần SSD thông thường."
  },
  {
    icon: "🛡️",
    title: "Tường Lửa Chống DDoS Độc Quyền",
    desc: "Hệ thống Anti-DDoS Firewall đa tầng Layer 3, 4 và 7 tự động nhận diện và lọc sạch các đợt tấn công SYN Flood, UDP Flood, HTTP Request Flood."
  },
  {
    icon: "🌐",
    title: "Hạ Tầng Datacenter Tier 3 Quốc Tế",
    desc: "Cụm máy chủ đặt tại các trung tâm dữ liệu đạt chuẩn Quốc tế TIA-942 Rated 3 tại Hà Nội và TP.HCM với cam kết 99.99% Uptime."
  },
  {
    icon: "🔄",
    title: "Tự Động Sao Lưu (Daily Backup)",
    desc: "Dữ liệu của bạn luôn an toàn với cơ chế Backup tự động hàng ngày độc lập ra cụm Storage ngoài và hỗ trợ khôi phục Snapshot 1-Click."
  },
  {
    icon: "👨‍💻",
    title: "Hỗ Trợ Kỹ Thuật 24/7/365",
    desc: "Đội ngũ chuyên gia hệ thống túc trực 24/7 qua Ticket, Hotline và LiveChat với thời gian phản hồi trung bình dưới 5 phút."
  },
  {
    icon: "💰",
    title: "Hoàn Tiền 100% Trong 30 Ngày",
    desc: "Cam kết hoàn lại 100% chi phí trong vòng 30 ngày nếu chất lượng dịch vụ không đáp ứng được kỳ vọng của quý khách hàng."
  }
];

export default function Home() {
  const [domainQuery, setDomainQuery] = useState("");
  const [domainResult, setDomainResult] = useState<{ checked: boolean; domain: string; available?: boolean; price?: string } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "vps" | "hosting" | "security">("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const plansRes = await apiFetch("/api/service-plans?pageSize=50");
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const rawItems = plansData.items || plansData;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const items = rawItems.filter((p: any) => p.isActive !== false);
            const enriched = await Promise.all(
              items.slice(0, 6).map(async (p: any) => {
                try {
                  const priceRes = await apiFetch(`/api/service-plans/${p.id}/prices`);
                  if (priceRes.ok) {
                    const prices = await priceRes.json();
                    const activePrices = prices.filter((pr: any) => pr.isActive !== false);
                    const activePrice = activePrices[0];
                    return {
                      ...p,
                      price: activePrice
                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activePrice.price)
                        : "Liên hệ",
                      unit: activePrice ? (activePrice.billingCycle === "Yearly" ? "năm" : "tháng") : "tháng"
                    };
                  }
                } catch {}
                return { ...p, price: "Liên hệ", unit: "tháng" };
              })
            );
            setPlans(enriched);
          } else {
            setPlans(MOCK_SERVICES);
          }
        } else {
          setPlans(MOCK_SERVICES);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu plans:", err);
        setPlans(MOCK_SERVICES);
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION & DOMAIN SEARCH */}
      <section className="relative overflow-hidden pt-28 pb-20 border-b border-white/10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/50 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            HẠ TẦNG CLOUD VPS & HOSTING TIÊU CHUẨN QUỐC TẾ TIER 3
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-5xl mx-auto">
            Hạ Tầng Điện Toán Đám Mây <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
              Tốc Độ Cực Đỉnh & Chống DDoS Vượt Trội
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Cung cấp giải pháp **Cloud VPS NVMe**, **Web Hosting LiteSpeed**, **Tên miền**, **Email doanh nghiệp** và **Tường lửa Anti-DDoS** chuyên sâu bảo vệ website an toàn 24/7.
          </p>

          {/* DOMAIN SEARCH BAR (Vietnix style) */}
          <div className="max-w-3xl mx-auto mb-12">
            <form onSubmit={handleDomainCheck} className="p-2 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 gap-3">
                <span className="text-slate-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Nhập tên miền bạn muốn đăng ký (VD: congtycuaban.vn, shoponline.com)..."
                  value={domainQuery}
                  onChange={(e) => setDomainQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none py-3"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/40 shrink-0"
              >
                Kiểm Tra Tên Miền
              </button>
            </form>

            {/* Quick Domain Pricing Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
              <span className="text-slate-400 font-medium">Bảng giá hot:</span>
              {DOMAIN_PRICES.map((d) => (
                <div key={d.tld} className="px-3 py-1 rounded-lg bg-slate-900/70 border border-white/10 flex items-center gap-2">
                  <span className="font-bold text-blue-400">{d.tld}</span>
                  <span className="text-slate-300 font-semibold">{d.price}</span>
                </div>
              ))}
            </div>

            {/* Domain Check Result Modal/Card */}
            {domainResult && domainResult.checked && (
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-blue-500/30 text-left flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white ${domainResult.available ? "bg-emerald-600" : "bg-rose-600"}`}>
                    {domainResult.available ? "✓" : "✕"}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{domainResult.domain}</h4>
                    <p className="text-xs text-slate-400">
                      {domainResult.available
                        ? `Tên miền còn trống! Giá đăng ký chỉ từ ${domainResult.price}`
                        : "Tên miền này đã có người đăng ký. Vui lòng chọn đuôi mở rộng khác."}
                    </p>
                  </div>
                </div>
                {domainResult.available ? (
                  <Link
                    href={`/order?plan=domain&name=${encodeURIComponent(domainResult.domain)}`}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Đăng Ký Ngay
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDomainResult(null)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5"
                  >
                    Đóng
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Key Metrics Strip (Viettel IDC / Vietnix Trust Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
              <div className="text-2xl md:text-3xl font-black text-blue-400">99.99%</div>
              <div className="text-xs text-slate-400 mt-1">Cam kết Uptime SLA</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
              <div className="text-2xl md:text-3xl font-black text-indigo-400">Tier 3</div>
              <div className="text-xs text-slate-400 mt-1">Datacenter Quốc Tế</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-400">100 Gbps+</div>
              <div className="text-xs text-slate-400 mt-1">Anti-DDoS Firewall Layer 3/4/7</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-center">
              <div className="text-2xl md:text-3xl font-black text-amber-400">24/7/365</div>
              <div className="text-xs text-slate-400 mt-1">Hỗ trợ kỹ thuật chuyên sâu</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SERVICES & PRICING TABS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Bảng Giá Dịch Vụ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Gói Cước Đám Mây Toàn Diện Cho Doanh Nghiệp
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Hạ tầng cấu hình cao, linh hoạt mở rộng tức thì không gián đoạn dịch vụ.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 bg-slate-900 rounded-xl border border-white/10 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab("vps")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "vps" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Cloud VPS
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "hosting" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Hosting NVMe
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "security" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Email & Bảo Mật
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Đang tải danh sách gói cước hạ tầng...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((svc) => (
              <div
                key={svc.id}
                className="group relative bg-slate-900/90 border border-white/10 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/50 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                        {svc.categoryName || "Cloud Service"}
                      </span>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {svc.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-6 line-clamp-2">
                    {svc.description}
                  </p>

                  <div className="h-[1px] bg-white/10 mb-6"></div>

                  {/* Specs List */}
                  <ul className="flex flex-col gap-3 mb-8">
                    {svc.cpu && svc.cpu !== "N/A" && (
                      <li className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="text-blue-400 text-sm">⚡</span>
                        <span><strong>CPU:</strong> {svc.cpu}</span>
                      </li>
                    )}
                    {svc.ram && svc.ram !== "N/A" && (
                      <li className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="text-indigo-400 text-sm">💾</span>
                        <span><strong>RAM:</strong> {svc.ram}</span>
                      </li>
                    )}
                    {svc.storage && svc.storage !== "N/A" && (
                      <li className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="text-emerald-400 text-sm">💽</span>
                        <span><strong>Ổ Cứng:</strong> {svc.storage}</span>
                      </li>
                    )}
                    {svc.bandwidth && svc.bandwidth !== "N/A" && (
                      <li className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="text-teal-400 text-sm">🚀</span>
                        <span><strong>Băng Thông:</strong> {svc.bandwidth}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="text-amber-400 text-sm">🛡️</span>
                      <span><strong>Bảo Vệ:</strong> {svc.antiDDoS || "Anti-DDoS Firewall & Backup"}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{svc.price}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {svc.unit || "tháng"}</span>
                  </div>

                  <Link
                    href={`/order?planId=${svc.id}`}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center transition-all shadow-md shadow-blue-900/30"
                  >
                    Đăng Ký Gói Ngay →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Xem bảng so sánh cấu hình chi tiết toàn bộ các gói cước →
          </Link>
        </div>
      </section>

      {/* 3. ANTI-DDOS & SECURITY SECTION (Vietnix Firewall & Viettel IDC Security) */}
      <section className="border-t border-white/10 bg-slate-900/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">Công Nghệ Độc Quyền</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                Tường Lửa Anti-DDoS Đa Tầng <br />
                <span className="text-teal-400">Bảo Vệ Toàn Diện Layer 3, 4 & 7</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Hệ thống tường lửa được phát triển chuyên biệt với khả năng phân tích gói tin thông minh bằng trí tuệ nhân tạo (AI Traffic Filter), tự động lọc sạch các cuộc tấn công DDoS quy mô hàng trăm Gbps mà không làm gián đoạn hoặc tăng độ trễ truy cập của người dùng thực.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                  <div className="text-base font-bold text-white mb-1">🛡️ Layer 3 & 4 Protection</div>
                  <p className="text-xs text-slate-400">Ngăn chặn triệt để SYN Flood, UDP Flood, ICMP Flood và Amplification attacks.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10">
                  <div className="text-base font-bold text-white mb-1">🤖 Layer 7 Web Filter (WAF)</div>
                  <p className="text-xs text-slate-400">Lọc HTTP/HTTPS Request Flood, chống cào dữ liệu trái phép (Bot Scraping).</p>
                </div>
              </div>

              <Link
                href="/services#anti-ddos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs transition-colors"
              >
                Khám Phá Giải Pháp Tường Lửa →
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/20 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Hạ Tầng Hoạt Động 100% An Toàn</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">Live Monitoring</span>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Lưu lượng lọc tối đa (Capacity):</span>
                  <span className="text-teal-400 font-bold">120 Gbps / 80 Mpps</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Thời gian phản hồi kích hoạt:</span>
                  <span className="text-emerald-400 font-bold">&lt; 0.5 giây (Tự động)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Độ trễ gia tăng (Latency):</span>
                  <span className="text-blue-400 font-bold">&lt; 1.5ms</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/5 flex justify-between items-center">
                  <span className="text-slate-400">Trạng thái Datacenter HN & HCM:</span>
                  <span className="text-emerald-400 font-bold">OPTIMAL (100% SLA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US (FEATURES GRID) */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Ưu Điểm Vượt Trội</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Tại Sao Doanh Nghiệp Chọn CloudService?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Chúng tôi xây dựng tiêu chuẩn dịch vụ khắt khe nhất nhằm đảm bảo hệ thống của bạn luôn vận hành liên tục và ổn định.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_HIGHLIGHT.map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/15 transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. LATEST NEWS SECTION */}
      {news.length > 0 && (
        <section className="border-t border-white/10 bg-slate-900/20 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Bản Tin & Khuyến Mãi</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Tin Tức Công Nghệ Mới</h2>
              </div>
              <Link href="/news" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Xem tất cả tin tức →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/15 transition-all">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2 mb-3 line-clamp-2 hover:text-blue-400 transition-colors">
                      <Link href={`/news/${item.id}`}>{item.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                      {item.summary}
                    </p>
                  </div>
                  <Link href={`/news/${item.id}`} className="text-xs font-bold text-blue-400 hover:underline inline-block mt-auto">
                    Đọc chi tiết →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border border-blue-500/30 relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Sẵn Sàng Nâng Tầm Hạ Tầng Công Nghệ?
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Đăng ký tài khoản ngay hôm nay để nhận ưu đãi dùng thử miễn phí và hỗ trợ chuyển đổi dữ liệu từ nhà cung cấp cũ hoàn toàn miễn phí.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/order"
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-950/50"
            >
              Bắt Đầu Triển Khai Dịch Vụ
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-bold text-sm transition-all"
            >
              Liên Hệ Chuyên Viên Tư Vấn
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
