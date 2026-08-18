"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function PricingPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | number | "all">("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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
          // Lấy giá thực tế của từng plan
          const enriched = await Promise.all(
            rawItems.map(async (p: any) => {
              try {
                const priceRes = await apiFetch(`/api/service-plans/${p.id}/prices`);
                if (priceRes.ok) {
                  const priceList = await priceRes.json();
                  const monthly = priceList.find((pr: any) => pr.billingCycle === "Monthly")?.price || 0;
                  const yearly = priceList.find((pr: any) => pr.billingCycle === "Yearly")?.price || (monthly > 0 ? monthly * 12 * 0.8 : 0);
                  return { ...p, monthlyPrice: monthly, yearlyPrice: yearly };
                }
              } catch {}
              return { ...p, monthlyPrice: 0, yearlyPrice: 0 };
            })
          );
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
                      {plan.qrCodeUrl && (
                        <img src={plan.qrCodeUrl} alt="QR Code" className="w-12 h-12 border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs" />
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      {plan.description || "Máy chủ ảo đám mây hiệu năng cao, sao lưu dữ liệu an toàn."}
                    </p>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-slate-100">
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
      </div>
    </div>
  );
}
