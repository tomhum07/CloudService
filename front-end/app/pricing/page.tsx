"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

export default function PricingPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | number | "all">("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [selectedQrPlan, setSelectedQrPlan] = useState<any | null>(null);

  useEffect(() => {
    fetchData();

    // Lắng nghe SignalR để cập nhật bảng giá, gói cước, danh mục tức thì
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "category" || entity === "price" || entity === "promotion" || entity === "all") {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, planRes] = await Promise.all([
        apiFetch("/api/service-categories?pageSize=100"),
        apiFetch("/api/service-plans?pageSize=200")
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const items = catData.items || catData;
        if (Array.isArray(items)) {
          setCategories(items);
        }
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        const rawItems = planData.items || planData;
        if (Array.isArray(rawItems)) {
          const enriched = rawItems.map((p: any) => {
            const prices = p.prices || [];
            const monthly = prices.find((pr: any) => pr.billingCycle === "Monthly")?.price || 0;
            const yearly = prices.find((pr: any) => pr.billingCycle === "Yearly")?.price || (monthly > 0 ? monthly * 12 * 0.8 : 0);
            return { ...p, monthlyPrice: monthly, yearlyPrice: yearly };
          });
          setPlans(enriched);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải bảng giá từ database:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = selectedCat === "all"
    ? plans
    : plans.filter(p => Number(p.categoryId) === Number(selectedCat) || Number(p.category?.id) === Number(selectedCat));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <span>⚡</span>
            <span>Bảng Giá Niêm Yết Đám Mây Toàn Diện</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Bảng Giá Dịch Vụ Điện Toán Đám Mây
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hạ tầng máy chủ Tier 3 hiện đại, ổ cứng Enterprise NVMe siêu tốc, cam kết Uptime 99.99% và hỗ trợ kỹ thuật 24/7/365.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-6 flex items-center justify-center gap-4">
            <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-500"}`}>
              Thanh Toán Hàng Tháng
            </span>
            <button
              onClick={() => setBillingCycle(b => b === "monthly" ? "yearly" : "monthly")}
              className={`w-14 h-7 rounded-full transition-colors relative p-1 focus:outline-none ${
                billingCycle === "yearly" ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  billingCycle === "yearly" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-blue-600 font-extrabold" : "text-slate-500"}`}>
              <span>Thanh Toán Theo Năm</span>
              <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-black">
                TIẾT KIỆM 20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedCat === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tất Cả Dịch Vụ
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCat === cat.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block mb-3"></span>
            <div>Đang tải dữ liệu bảng giá từ cơ sở dữ liệu...</div>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có gói cước nào</h3>
            <p className="text-xs text-slate-500">
              Vui lòng truy cập trang quản trị để thêm danh mục và gói dịch vụ mới vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => {
              const currentPrice = billingCycle === "yearly"
                ? plan.yearlyPrice
                : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl transition-all relative group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                          {plan.category?.name || "Cloud Service"}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mt-2">{plan.name}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      {plan.description || "Máy chủ ảo đám mây hiệu năng cao, sao lưu dữ liệu an toàn."}
                    </p>

                    {/* Price */}
                    <div className="mb-5 pb-5 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          {currentPrice > 0
                            ? new Intl.NumberFormat("vi-VN").format(currentPrice)
                            : "Liên hệ"}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {currentPrice > 0 ? (billingCycle === "yearly" ? "đ / năm" : "đ / tháng") : ""}
                        </span>
                      </div>
                      {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                        <div className="text-[11px] text-emerald-600 font-bold mt-1">
                          Tương đương {new Intl.NumberFormat("vi-VN").format(Math.round(plan.yearlyPrice / 12))}đ/tháng
                        </div>
                      )}
                    </div>

                    {/* Prominent Large QR Code Section */}
                    {plan.qrCodeUrl && (
                      <div
                        onClick={() => setSelectedQrPlan(plan)}
                        className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl mb-6 flex items-center gap-3.5 cursor-pointer transition-all duration-200 group/qr shadow-xs"
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

                    {/* Hardware Specs */}
                    <div className="space-y-3 mb-8">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Cấu hình phần cứng:
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <span className="text-blue-600 font-bold">⚡ CPU:</span>
                        <span>{plan.cpu || "1 vCPU"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <span className="text-blue-600 font-bold">🧠 RAM:</span>
                        <span>{plan.ram || "2 GB RAM"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <span className="text-blue-600 font-bold">💾 Ổ cứng:</span>
                        <span>{plan.storage || "30 GB NVMe"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-700">
                        <span className="text-blue-600 font-bold">🌐 Băng thông:</span>
                        <span>{plan.bandwidth || "1 Gbps Không giới hạn"}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/order?planId=${plan.id}&cycle=${billingCycle}`}
                    className="w-full py-3.5 rounded-xl font-bold text-xs text-center transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 block"
                  >
                    Đăng Ký Gói Này →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Matrix */}
        <div className="mt-20 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Tiêu Chuẩn Phần Cứng</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Cam Kết Chất Lượng Dịch Vụ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:border-blue-200 transition-all group shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Enterprise NVMe U.2 / U.3</h4>
              <p className="text-slate-600 leading-relaxed">
                Tốc độ đọc/ghi ngẫu nhiên IOPS lên đến 800.000 IOPS, đảm bảo website thương mại điện tử và cơ sở dữ liệu luôn xử lý tức thì.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:border-emerald-200 transition-all group shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Anti-DDoS 100Gbps Miễn Phí</h4>
              <p className="text-slate-600 leading-relaxed">
                Tự động nhận diện và lọc lưu lượng tấn công SYN/UDP Flood và Layer 7 HTTP Request mà không gây nghẽn đường truyền.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 hover:bg-white hover:border-amber-200 transition-all group shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Sao Lưu Độc Lập Hàng Ngày</h4>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống tự động sao lưu Snapshot định kỳ mỗi ngày sang cụm Storage độc lập, phục hồi 1-Click khi cần thiết.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PHÓNG TO MÃ QR KHỔ LỚN TRÊN TRANG BẢNG GIÁ */}
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
                {selectedQrPlan.category?.name || "Gói Dịch Vụ"}
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
                href={`/order?planId=${selectedQrPlan.id}&cycle=${billingCycle}`}
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
    </div>
  );
}
