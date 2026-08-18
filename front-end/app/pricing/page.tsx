"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

const MOCK_CATEGORIES = [
  { id: 1, name: "Cloud VPS", slug: "vps" },
  { id: 2, name: "Cloud Hosting", slug: "hosting" },
  { id: 3, name: "Tên Miền", slug: "domain" },
  { id: 4, name: "Email Doanh Nghiệp", slug: "email" },
  { id: 5, name: "Bảo Mật & Firewall", slug: "security" }
];

const MOCK_PLANS = [
  {
    id: 1,
    categoryId: 1,
    name: "Cloud VPS NVMe Pro",
    cpu: "2 vCPUs AMD EPYC",
    ram: "4 GB RAM ECC",
    storage: "60 GB NVMe Gen4",
    bandwidth: "1 Gbps Unmetered",
    monthlyPrice: 150000,
    yearlyPrice: 1440000,
    popular: true
  },
  {
    id: 2,
    categoryId: 1,
    name: "Cloud VPS NVMe Enterprise",
    cpu: "4 vCPUs AMD EPYC",
    ram: "8 GB RAM ECC",
    storage: "120 GB NVMe Gen4",
    bandwidth: "1 Gbps Dedicated",
    monthlyPrice: 320000,
    yearlyPrice: 3072000,
    popular: false
  },
  {
    id: 3,
    categoryId: 1,
    name: "Cloud VPS SSD Tiết Kiệm",
    cpu: "1 vCPU Intel Xeon",
    ram: "2 GB RAM",
    storage: "40 GB SSD Enterprise",
    bandwidth: "500 Mbps Port",
    monthlyPrice: 90000,
    yearlyPrice: 864000,
    popular: false
  },
  {
    id: 4,
    categoryId: 2,
    name: "MaxSpeed Hosting NVMe",
    cpu: "LiteSpeed Enterprise",
    ram: "2 GB RAM",
    storage: "25 GB NVMe",
    bandwidth: "Không giới hạn",
    monthlyPrice: 45000,
    yearlyPrice: 432000,
    popular: true
  },
  {
    id: 5,
    categoryId: 2,
    name: "Business Hosting Pro",
    cpu: "AMD EPYC 7003",
    ram: "4 GB RAM",
    storage: "50 GB NVMe",
    bandwidth: "Không giới hạn",
    monthlyPrice: 120000,
    yearlyPrice: 1152000,
    popular: false
  },
  {
    id: 6,
    categoryId: 3,
    name: "Tên Miền .COM",
    cpu: "ICANN Quốc Tế",
    ram: "DNS Anycast",
    storage: "Whois Privacy Miễn phí",
    bandwidth: "Kích hoạt tức thì",
    monthlyPrice: 249000,
    yearlyPrice: 249000,
    popular: true
  },
  {
    id: 7,
    categoryId: 3,
    name: "Tên Miền Quốc Gia .VN",
    cpu: "VNNIC Việt Nam",
    ram: "Bảo hộ thương hiệu",
    storage: "DNS VNPT / Viettel",
    bandwidth: "Ưu tiên SEO VN",
    monthlyPrice: 450000,
    yearlyPrice: 450000,
    popular: false
  },
  {
    id: 8,
    categoryId: 4,
    name: "Email Doanh Nghiệp Pro",
    cpu: "5 Hòm thư riêng",
    ram: "10 GB Dung lượng",
    storage: "Antispam & Antivirus",
    bandwidth: "Gửi nhận không giới hạn",
    monthlyPrice: 99000,
    yearlyPrice: 950000,
    popular: true
  },
  {
    id: 9,
    categoryId: 5,
    name: "Tường Lửa Anti-DDoS 100Gbps",
    cpu: "Layer 3/4/7 AI Filter",
    ram: "Độ trễ < 2ms",
    storage: "WAF Bảo vệ Web App",
    bandwidth: "Dedicated Clean IP",
    monthlyPrice: 350000,
    yearlyPrice: 3360000,
    popular: true
  }
];

export default function PricingPage() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [plans, setPlans] = useState(MOCK_PLANS);
  const [selectedCat, setSelectedCat] = useState<number | "all">("all");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const catRes = await apiFetch("/api/service-categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
        }
      }

      const planRes = await apiFetch("/api/service-plans");
      if (planRes.ok) {
        const planData = await planRes.json();
        if (Array.isArray(planData) && planData.length > 0) {
          setPlans(planData);
        }
      }
    } catch {
      console.warn("Sử dụng bảng giá cấu hình mặc định.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (selectedCat === "all") return true;
    return p.categoryId === selectedCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Bảng báo giá</span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-3">
            Bảng Giá Dịch Vụ Niêm Yết
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Bảng Báo Giá Minh Bạch & Tiết Kiệm
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Không phát sinh chi phí ẩn. Cam kết hoàn tiền 100% trong vòng 30 ngày nếu không hài lòng với chất lượng dịch vụ.
          </p>
        </div>

        {/* Controls: Category Filter & Billing Cycle Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCat === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tất Cả Dịch Vụ
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedCat === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Thanh Toán Hàng Tháng
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                billingCycle === "yearly"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Theo Năm</span>
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>

        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredPlans.map((plan) => {
            const displayPrice =
              billingCycle === "yearly"
                ? `${Math.round((plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8) / 12).toLocaleString("vi-VN")}đ`
                : `${plan.monthlyPrice.toLocaleString("vi-VN")}đ`;

            return (
              <div
                key={plan.id}
                className={`p-7 rounded-2xl border bg-white flex flex-col justify-between relative transition-all ${
                  plan.popular
                    ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                    Gói Phổ Biến Nhất
                  </span>
                )}

                <div>
                  <h3 className="text-base font-black text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-blue-600">{displayPrice}</span>
                    <span className="text-xs text-slate-500 font-normal">/ tháng</span>
                  </div>

                  <div className="h-[1px] bg-slate-100 mb-6"></div>

                  <ul className="space-y-3 text-xs text-slate-700 mb-8">
                    {plan.cpu && (
                      <li className="flex items-center gap-2.5">
                        <span className="text-blue-600 font-bold">⚡ CPU:</span>
                        <span>{plan.cpu}</span>
                      </li>
                    )}
                    {plan.ram && (
                      <li className="flex items-center gap-2.5">
                        <span className="text-blue-600 font-bold">💾 RAM:</span>
                        <span>{plan.ram}</span>
                      </li>
                    )}
                    {plan.storage && (
                      <li className="flex items-center gap-2.5">
                        <span className="text-blue-600 font-bold">💽 Lưu trữ:</span>
                        <span>{plan.storage}</span>
                      </li>
                    )}
                    {plan.bandwidth && (
                      <li className="flex items-center gap-2.5">
                        <span className="text-blue-600 font-bold">🚀 Băng thông:</span>
                        <span>{plan.bandwidth}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2.5">
                      <span className="text-emerald-600 font-bold">🛡️ Bảo mật:</span>
                      <span>Anti-DDoS Firewall & SSL miễn phí</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={`/order?planId=${plan.id}&cycle=${billingCycle === "yearly" ? "12m" : "1m"}`}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                    plan.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                      : "bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200"
                  }`}
                >
                  Đăng Ký Khởi Tạo Ngay →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Guarantee Strip */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Bạn Cần Báo Giá Cấu Hình Riêng Biệt?</h3>
          <p className="text-xs text-slate-600 max-w-xl mx-auto mb-6">
            Đội ngũ chuyên viên của CloudService sẵn sàng hỗ trợ khảo sát và tối ưu bảng giá theo quy mô dự án của bạn.
          </p>
          <Link
            href="/order"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-block transition-colors shadow-sm"
          >
            Liên Hệ Kỹ Sư Tư Vấn
          </Link>
        </div>

      </div>
    </div>
  );
}
