"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

const MOCK_CATEGORIES = [
  { id: 1, name: "Cloud VPS" },
  { id: 2, name: "Cloud Hosting" }
];

const MOCK_PLANS = [
  {
    id: 1,
    categoryId: 1,
    name: "VPS Starter",
    cpu: "1 vCPU",
    ram: "2 GB RAM",
    storage: "40 GB NVMe SSD",
    bandwidth: "500 Mbps Shared",
    monthlyPrice: 90000,
    yearlyPrice: 864000 // 90000 * 12 * 0.8 (20% off)
  },
  {
    id: 2,
    categoryId: 1,
    name: "VPS Pro",
    cpu: "2 vCPUs",
    ram: "4 GB RAM",
    storage: "80 GB NVMe SSD",
    bandwidth: "1 Gbps Unmetered",
    monthlyPrice: 150000,
    yearlyPrice: 1440000
  },
  {
    id: 3,
    categoryId: 1,
    name: "VPS Enterprise",
    cpu: "4 vCPUs",
    ram: "8 GB RAM",
    storage: "150 GB NVMe SSD",
    bandwidth: "1 Gbps Dedicated",
    monthlyPrice: 320000,
    yearlyPrice: 3072000
  },
  {
    id: 4,
    categoryId: 2,
    name: "Hosting Basic",
    cpu: "Shared 1 Core",
    ram: "1 GB RAM",
    storage: "10 GB NVMe SSD",
    bandwidth: "Unlimited",
    monthlyPrice: 350000,
    yearlyPrice: 336000
  },
  {
    id: 5,
    categoryId: 2,
    name: "Hosting Business",
    cpu: "Shared 2 Cores",
    ram: "2 GB RAM",
    storage: "30 GB NVMe SSD",
    bandwidth: "Unlimited",
    monthlyPrice: 85000,
    yearlyPrice: 816000
  }
];

export default function PricingPage() {
  const [categories, setCategories] = useState<any[]>(MOCK_CATEGORIES);
  const [plans, setPlans] = useState<any[]>(MOCK_PLANS);
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await apiFetch("/api/service-categories");
        const plansRes = await apiFetch("/api/service-plans?pageSize=50");
        
        let loadedCats = MOCK_CATEGORIES;
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            loadedCats = catData;
            setCategories(catData);
            setSelectedCategory(catData[0].id);
          }
        }

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          const items = plansData.items || plansData;
          if (Array.isArray(items) && items.length > 0) {
            // Get prices for all plans
            const enriched = await Promise.all(
              items.map(async (p: any) => {
                let monthlyPrice = 100000;
                let yearlyPrice = 960000;
                try {
                  const prRes = await apiFetch(`/api/service-plans/${p.id}/prices`);
                  if (prRes.ok) {
                    const prices = await prRes.json();
                    const mPriceObj = prices.find((pr: any) => pr.billingCycle === "Monthly" && pr.isActive);
                    const yPriceObj = prices.find((pr: any) => pr.billingCycle === "Yearly" && pr.isActive);
                    if (mPriceObj) monthlyPrice = Number(mPriceObj.price);
                    if (yPriceObj) {
                      yearlyPrice = Number(yPriceObj.price);
                    } else {
                      yearlyPrice = monthlyPrice * 12 * 0.8; // default 20% discount
                    }
                  }
                } catch {}
                return {
                  ...p,
                  monthlyPrice,
                  yearlyPrice
                };
              })
            );
            setPlans(enriched);
          }
        }
      } catch (err) {
        console.error("Lỗi tải thông tin giá cả:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredPlans = plans.filter((p) => p.categoryId === selectedCategory);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Bảng giá rõ ràng</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Bảng Giá Dịch Vụ Đám Mây
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Không phí ẩn, không cam kết dài hạn phiền phức. Hoàn tiền 100% trong vòng 7 ngày nếu không hài lòng.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 bg-slate-900 p-4 rounded-xl border border-white/5">
          {/* Category Tabs */}
          <div className="flex gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-xs ${billingCycle === "monthly" ? "text-white font-bold" : "text-slate-400"}`}>
              Theo tháng
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-12 h-6 rounded-full bg-slate-800 border border-white/10 relative p-1 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-full bg-blue-500 transition-transform ${
                  billingCycle === "yearly" ? "translate-x-6" : ""
                }`}
              ></div>
            </button>
            <span className={`text-xs flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-white font-bold" : "text-slate-400"}`}>
              Theo năm <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-400 font-bold text-[9px] uppercase">Tiết kiệm 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Đang tải cấu hình bảng giá...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">Không tìm thấy gói dịch vụ nào trong mục này.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPlans.map((plan) => {
              const currentPrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const perMonthEquivalent = billingCycle === "monthly" ? currentPrice : Math.round(currentPrice / 12);
              
              return (
                <div key={plan.id} className="bg-slate-900 border border-white/5 rounded-2xl p-8 flex flex-col justify-between hover:border-white/10 transition-colors relative">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                      {plan.description || `Gói cấu hình hiệu năng cao phục vụ cho website và lập trình.`}
                    </p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">{formatPrice(perMonthEquivalent)}</span>
                        <span className="text-xs text-slate-400">/ tháng</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <p className="text-[10px] text-green-400 mt-1 font-semibold">
                          Thanh toán {formatPrice(currentPrice)} / năm
                        </p>
                      )}
                    </div>

                    {/* Specs Table */}
                    <div className="border-t border-white/5 pt-4 space-y-3 mb-8">
                      {plan.cpu && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Vi xử lý CPU:</span>
                          <span className="text-white font-semibold">{plan.cpu}</span>
                        </div>
                      )}
                      {plan.ram && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Dung lượng RAM:</span>
                          <span className="text-white font-semibold">{plan.ram}</span>
                        </div>
                      )}
                      {plan.storage && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Ổ cứng NVMe SSD:</span>
                          <span className="text-white font-semibold">{plan.storage}</span>
                        </div>
                      )}
                      {plan.bandwidth && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Băng thông:</span>
                          <span className="text-white font-semibold">{plan.bandwidth}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlanForPayment(plan)}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    Đăng Ký & Thanh Toán
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ section */}
        <section className="mt-24 border-t border-white/10 pt-16">
          <h2 className="text-xl font-bold text-white mb-8 text-center">Các câu hỏi thường gặp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-300">
            <div>
              <h4 className="font-bold text-white mb-2">Tôi có thể nâng cấp gói sau này không?</h4>
              <p className="leading-relaxed text-slate-400">
                Có, bạn có thể tự động nâng cấp CPU, RAM, dung lượng SSD bất kỳ lúc nào trực tiếp trong trang quản trị mà không làm gián đoạn hay mất dữ liệu hệ thống.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Hình thức thanh toán nào được chấp nhận?</h4>
              <p className="leading-relaxed text-slate-400">
                Chúng tôi chấp nhận hình thức chuyển khoản ngân hàng thông qua mã QR quét tự động bảo lãnh ngân hàng MB Bank, MoMo, hoặc thẻ Visa/Mastercard.
              </p>
            </div>
          </div>
        </section>

        {/* Simulated QR Code Modal */}
        {selectedPlanForPayment && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 relative">
              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
              
              <h3 className="text-base font-bold text-white mb-2 text-center">Thông Tin Thanh Toán</h3>
              <p className="text-[11px] text-slate-400 text-center mb-6">
                Vui lòng quét mã QR dưới đây hoặc chuyển khoản đúng số tiền để hệ thống kích hoạt tự động.
              </p>

              {/* QR Code Graphic (SVG) */}
              <div className="bg-white p-4 rounded-xl w-48 h-48 mx-auto mb-6 flex flex-col justify-between items-center border border-slate-200">
                {/* SVG mock QR code */}
                <svg className="w-40 h-40 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer borders */}
                  <path d="M0 0h30v10H10v20H0zm0 100h30V90H10V70H0zm100-100H70v10h20v20h10zm0 100H70V90h20V70h10z" />
                  {/* Inners */}
                  <path d="M15 15h10v10H15zm60 0h10v10H75zm0 60h10v10H75zm-30-30h10v10H45z" />
                  <path d="M35 15h10v5H35zm0 25h20v5H35zm25 15h10v15H60zm-20 20h15v5H40zm-15-5h10v5H25z" />
                  <path d="M5 45h5v15H5zm50-10h5v10h-5zm15-20h5v5h-5zm0 30h5v5h-5zm-15-5h5v5h-5z" />
                  {/* Center branding */}
                  <rect x="42" y="42" width="16" height="16" fill="#1e3a8a" rx="2" />
                  <text x="50" y="53" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">CS</text>
                </svg>
              </div>

              {/* Payment Text Details */}
              <div className="space-y-2 border-t border-white/5 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gói đăng ký:</span>
                  <span className="text-white font-bold">{selectedPlanForPayment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chu kỳ:</span>
                  <span className="text-white">{billingCycle === "monthly" ? "1 Tháng" : "1 Năm (Giảm 20%)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tiền:</span>
                  <span className="text-blue-400 font-extrabold font-mono">
                    {formatPrice(billingCycle === "monthly" ? selectedPlanForPayment.monthlyPrice : selectedPlanForPayment.yearlyPrice)}
                  </span>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="text-white font-semibold">MB BANK (Ngân hàng Quân Đội)</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <span className="text-white font-mono font-bold">1900 8888 6666</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="text-white font-semibold">CONG TY CP CLOUDSERVICE</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <span className="text-yellow-400 font-mono font-bold">PAY {selectedPlanForPayment.id} {billingCycle.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedPlanForPayment(null)}
                  className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    alert("Yêu cầu thanh toán của bạn đang được hệ thống xử lý tự động. Vui lòng kiểm tra email của bạn để nhận thông tin cấu hình VPS.");
                    setSelectedPlanForPayment(null);
                  }}
                  className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
                >
                  Xác nhận chuyển
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
