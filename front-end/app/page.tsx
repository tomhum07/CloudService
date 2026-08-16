"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

// Fallback Mock Data
const MOCK_SERVICES = [
  {
    id: 1,
    name: "Cloud VPS Pro",
    categoryName: "Cloud VPS",
    description: "Giải pháp máy chủ ảo hiệu năng cực đỉnh, ổ cứng NVMe siêu tốc, cấu hình CPU và RAM mạnh mẽ riêng biệt.",
    cpu: "2 vCPUs Intel Xeon",
    ram: "4 GB RAM LPDDR4",
    storage: "80 GB NVMe Storage",
    bandwidth: "1 Gbps không giới hạn",
    price: "150.000đ"
  },
  {
    id: 2,
    name: "Cloud Hosting NVMe",
    categoryName: "Cloud Hosting",
    description: "Hosting tốc độ cao tối ưu riêng cho WordPress. Tích hợp sẵn chứng chỉ bảo mật SSL và sao lưu tự động.",
    cpu: "Shared vCPU",
    ram: "2 GB RAM",
    storage: "20 GB NVMe Storage",
    bandwidth: "Không giới hạn",
    price: "35.000đ"
  },
  {
    id: 3,
    name: "Tên Miền (Domain)",
    categoryName: "Domain",
    description: "Đăng ký tên miền giá rẻ nhất thị trường. Hệ thống quản lý DNS chuyên nghiệp hoàn toàn miễn phí.",
    cpu: "N/A",
    ram: "N/A",
    storage: "N/A",
    bandwidth: "N/A",
    price: "99.000đ"
  }
];

const MOCK_TESTIMONIALS = [
  {
    id: 1,
    clientName: "Nguyễn Văn Hùng",
    company: "CTO TechVina",
    content: "Dịch vụ Cloud VPS ở đây cực kỳ ổn định. Hệ thống uptime đạt gần như tuyệt đối, hỗ trợ kỹ thuật rất nhanh chóng phản hồi.",
    rating: 5
  },
  {
    id: 2,
    clientName: "Trần Thị Lan",
    company: "Founder ShopOnline",
    content: "Đã chuyển toàn bộ website WordPress về Hosting NVMe của CloudService. Tốc độ tải trang nhanh hơn hẳn giúp cải thiện doanh số.",
    rating: 5
  },
  {
    id: 3,
    clientName: "Phạm Minh Đức",
    company: "Developer SaaS Corp",
    content: "API tích hợp đơn giản, bảng điều khiển dễ quản lý. Giá cả rất cạnh tranh so với các nhà cung cấp nước ngoài.",
    rating: 5
  }
];

const MOCK_NEWS = [
  {
    id: 1,
    title: "Chương trình khuyến mãi hè rực rỡ - Tặng 30% giá trị nạp",
    summary: "Đón chào mùa hè sôi động, CloudService mang đến chương trình ưu đãi cực lớn cho toàn bộ khách hàng đăng ký mới dịch vụ.",
    createdAt: "2026-08-10T08:00:00Z"
  },
  {
    id: 2,
    title: "Nâng cấp hạ tầng Datacenters tại Hà Nội và TP.HCM",
    summary: "Nhằm mang lại trải nghiệm tốt nhất, chúng tôi vừa hoàn thành đợt bảo trì nâng cấp băng thông mạng lên 40Gbps.",
    createdAt: "2026-08-05T09:30:00Z"
  },
  {
    id: 3,
    title: "Hướng dẫn cài đặt SSL miễn phí trên Cloud Hosting",
    summary: "Bài viết này hướng dẫn chi tiết các bước kích hoạt chứng chỉ Let's Encrypt SSL tự động chỉ với 1 click chuột.",
    createdAt: "2026-08-01T14:00:00Z"
  }
];

export default function Home() {
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Plans
        const plansRes = await apiFetch("/api/service-plans?pageSize=3");
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const items = plansData.items || plansData;
          if (Array.isArray(items) && items.length > 0) {
            // Get prices for each plan
            const enriched = await Promise.all(
              items.slice(0, 3).map(async (p: any) => {
                try {
                  const priceRes = await apiFetch(`/api/service-plans/${p.id}/prices`);
                  if (priceRes.ok) {
                    const prices = await priceRes.json();
                    const activePrice = prices.find((pr: any) => pr.isActive) || prices[0];
                    return {
                      ...p,
                      price: activePrice
                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activePrice.price)
                        : "Liên hệ",
                      unit: activePrice ? (activePrice.billingCycle === "Yearly" ? "năm" : "tháng") : ""
                    };
                  }
                } catch {}
                return { ...p, price: "Liên hệ", unit: "" };
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
        // Fetch Testimonials
        const testRes = await apiFetch("/api/testimonials");
        if (testRes.ok) {
          const testData = await testRes.json();
          if (Array.isArray(testData) && testData.length > 0) {
            setTestimonials(testData.slice(0, 3));
          } else {
            setTestimonials(MOCK_TESTIMONIALS);
          }
        } else {
          setTestimonials(MOCK_TESTIMONIALS);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu testimonials:", err);
        setTestimonials(MOCK_TESTIMONIALS);
      }

      try {
        // Fetch News
        const newsRes = await apiFetch("/api/news?pageSize=3");
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const items = newsData.items || newsData;
          if (Array.isArray(items) && items.length > 0) {
            setNews(items.slice(0, 3));
          } else {
            setNews(MOCK_NEWS);
          }
        } else {
          setNews(MOCK_NEWS);
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu news:", err);
        setNews(MOCK_NEWS);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-800/60 inline-block mb-6 tracking-wide">
          🚀 NỀN TẢNG ĐIỆN TOÁN ĐÁM MÂY THẾ HỆ MỚI
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
          Chất Lượng Vượt Trội <br />
          <span className="text-blue-500">Tốc Độ Vượt Giới Hạn</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Cung cấp máy chủ đám mây tốc độ cực đại, băng thông không giới hạn và bảo mật tối đa giúp nâng tầm hạ tầng kỹ thuật của doanh nghiệp bạn.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/order"
            className="w-full sm:w-auto px-8 h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center transition-colors shadow-sm shadow-blue-900/30"
          >
            Đăng Ký Đặt Hàng
          </Link>
          <Link
            href="/services"
            className="w-full sm:w-auto px-8 h-14 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-semibold flex items-center justify-center transition-colors"
          >
            Tìm Hiểu Dịch Vụ
          </Link>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10 bg-slate-950">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Các Gói Dịch Vụ Nổi Bật</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Lựa chọn gói cấu hình tối ưu để triển khai ứng dụng, website hoặc cơ sở dữ liệu của bạn ngay lập tức.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm">Đang tải cấu hình dịch vụ...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((svc) => (
              <div key={svc.id} className="glow-card rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-white">{svc.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                      {svc.categoryName || "Gói Dịch Vụ"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 h-12 overflow-hidden">
                    {svc.description || "Hạ tầng đám mây cao cấp phục vụ cho nhu cầu lưu trữ và vận hành doanh nghiệp."}
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {svc.cpu && svc.cpu !== "N/A" && (
                      <li className="flex items-center gap-2.5 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>CPU:</strong> {svc.cpu}
                      </li>
                    )}
                    {svc.ram && svc.ram !== "N/A" && (
                      <li className="flex items-center gap-2.5 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>RAM:</strong> {svc.ram}
                      </li>
                    )}
                    {svc.storage && svc.storage !== "N/A" && (
                      <li className="flex items-center gap-2.5 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Lưu trữ:</strong> {svc.storage}
                      </li>
                    )}
                    {svc.bandwidth && svc.bandwidth !== "N/A" && (
                      <li className="flex items-center gap-2.5 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <strong>Băng thông:</strong> {svc.bandwidth}
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{svc.price}</span>
                    {svc.unit && <span className="text-xs text-slate-400">/ {svc.unit}</span>}
                  </div>
                  <Link
                    href={`/order?planId=${svc.id}`}
                    className="w-full h-12 rounded-xl bg-slate-900 border border-white/10 hover:bg-blue-600 hover:border-transparent text-white font-semibold text-xs flex items-center justify-center transition-all"
                  >
                    Đăng Ký Ngay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. TESTIMONIALS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10 bg-slate-900/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Ý Kiến Khách Hàng</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Hàng ngàn doanh nghiệp lớn nhỏ và các kỹ sư phần mềm đã tin cậy và đồng hành cùng CloudService.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test) => (
            <div key={test.id} className="bg-slate-900 border border-white/5 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(test.rating || 5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed mb-6">
                  &ldquo;{test.content}&rdquo;
                </p>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-sm font-bold text-white">{test.clientName}</h4>
                <p className="text-xs text-slate-500">{test.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LATEST NEWS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10 bg-slate-950">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Tin Tức Mới Nhất</h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Cập nhật thông tin công nghệ đám mây, hướng dẫn sử dụng và các hoạt động của CloudService.
            </p>
          </div>
          <Link
            href="/news"
            className="mt-4 md:mt-0 text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            Xem tất cả bài viết →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="glow-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-3 line-clamp-2 hover:text-blue-400 transition-colors">
                  <Link href={`/news/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                  {item.summary}
                </p>
              </div>
              <Link
                href={`/news/${item.id}`}
                className="text-xs font-semibold text-blue-400 hover:underline inline-block mt-auto"
              >
                Đọc bài viết
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
