"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

const PRESET_PLANS = [
  { id: 1, name: "Cloud VPS Starter", type: "VPS", price: 90000 },
  { id: 2, name: "Cloud VPS Pro", type: "VPS", price: 150000 },
  { id: 3, name: "Cloud VPS Enterprise", type: "VPS", price: 320000 },
  { id: 4, name: "Cloud Hosting Basic", type: "Hosting", price: 35000 },
  { id: 5, name: "Cloud Hosting Business", type: "Hosting", price: 85000 }
];

const LINUX_OS_LIST = [
  "Ubuntu 22.04 LTS",
  "CentOS Stream 9",
  "Debian 12 Bookworm",
  "AlmaLinux 9.4",
  "Windows Server 2022 (Trial)"
];

function OrderFormContent() {
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("planId");
  const planTypeParam = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [selectedPlanId, setSelectedPlanId] = useState<number>(2); // Default to VPS Pro
  const [os, setOs] = useState<string>("Ubuntu 22.04 LTS");
  const [billingCycle, setBillingCycle] = useState<string>("Monthly");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");

  // Completed Order State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  // Auto pre-select plan if passed from URL
  useEffect(() => {
    if (planIdParam) {
      const parsed = parseInt(planIdParam, 10);
      if (!isNaN(parsed) && PRESET_PLANS.some((p) => p.id === parsed)) {
        setSelectedPlanId(parsed);
      }
    } else if (planTypeParam) {
      if (planTypeParam.toLowerCase() === "hosting") {
        setSelectedPlanId(4); // default hosting
      } else if (planTypeParam.toLowerCase() === "vps") {
        setSelectedPlanId(2); // default VPS
      }
    }
  }, [planIdParam, planTypeParam]);

  const selectedPlan = PRESET_PLANS.find((p) => p.id === selectedPlanId) || PRESET_PLANS[0];

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "CLOUDSERVICE2026") {
      setDiscountPercent(15);
      alert("Áp dụng mã giảm giá thành công! Bạn được giảm 15% tổng hóa đơn.");
    } else {
      alert("Mã giảm giá không hợp lệ.");
      setDiscountPercent(0);
    }
  };

  const getCycleMultiplier = () => {
    switch (billingCycle) {
      case "Quarterly":
        return 3;
      case "HalfYearly":
        return 6;
      case "Yearly":
        return 12 * 0.8; // 20% discount for yearly
      default:
        return 1;
    }
  };

  const calculateTotal = () => {
    const rawTotal = selectedPlan.price * getCycleMultiplier();
    const discountAmount = rawTotal * (discountPercent / 100);
    return Math.max(0, Math.round(rawTotal - discountAmount));
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(val);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      alert("Vui lòng điền đầy đủ các thông tin cá nhân bắt buộc.");
      return;
    }

    setLoading(true);
    const orderData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      serviceType: selectedPlan.type,
      os: selectedPlan.type === "VPS" ? os : "N/A",
      billingCycle,
      fullName,
      email,
      phone,
      promoCode,
      notes,
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      orderCode: "ORD-" + Math.floor(100000 + Math.random() * 900000)
    };

    try {
      // Try posting to API
      const res = await apiFetch("/api/order-requests", {
        method: "POST",
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const responseData = await res.json();
        setCreatedOrder(responseData);
      } else {
        // Fallback simulate locally
        setCreatedOrder(orderData);
      }
    } catch (err) {
      console.warn("API order submission error. Using mock response:", err);
      // Fallback
      setCreatedOrder(orderData);
    }

    setLoading(false);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Đăng Ký Đặt Hàng</h1>
          <p className="text-xs text-slate-400">
            Triển khai hạ tầng đám mây cao cấp chỉ với vài thao tác đơn giản.
          </p>
        </div>

        {/* Steps Progress Indicator */}
        <div className="flex items-center justify-between mb-12 px-6">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            }`}>1</div>
            <span className={`text-xs ${step >= 1 ? "text-white font-semibold" : "text-slate-500"}`}>Cấu hình gói</span>
          </div>
          <div className="flex-1 h-[1px] bg-white/10 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            }`}>2</div>
            <span className={`text-xs ${step >= 2 ? "text-white font-semibold" : "text-slate-500"}`}>Thông tin đăng ký</span>
          </div>
          <div className="flex-1 h-[1px] bg-white/10 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            }`}>3</div>
            <span className={`text-xs ${step >= 3 ? "text-white font-semibold" : "text-slate-500"}`}>Thanh toán</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
          
          {/* STEP 1: Plan & Configuration */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-6">Bước 1: Chọn dịch vụ & Cấu hình</h2>
              
              {/* Select Plan */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Gói dịch vụ
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRESET_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        selectedPlanId === plan.id
                          ? "bg-slate-800 border-blue-600"
                          : "bg-slate-950 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">{plan.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          {plan.type}
                        </span>
                      </div>
                      <span className="text-xs text-blue-400 font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-[10px] text-slate-500"> / tháng</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OS Selection for VPS */}
              {selectedPlan.type === "VPS" && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Hệ điều hành (OS)
                  </label>
                  <select
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {LINUX_OS_LIST.map((osItem) => (
                      <option key={osItem} value={osItem}>
                        {osItem}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Billing Cycle */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                  Chu kỳ thanh toán
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "1 Tháng", value: "Monthly" },
                    { label: "3 Tháng", value: "Quarterly" },
                    { label: "6 Tháng", value: "HalfYearly" },
                    { label: "12 Tháng (Giảm 20%)", value: "Yearly" }
                  ].map((cycle) => (
                    <button
                      key={cycle.value}
                      type="button"
                      onClick={() => setBillingCycle(cycle.value)}
                      className={`py-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        billingCycle === cycle.value
                          ? "bg-blue-600 text-white border-transparent"
                          : "bg-slate-950 border-white/5 hover:border-white/10 text-slate-400"
                      }`}
                    >
                      {cycle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 h-10 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors"
                >
                  Tiếp Tục →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Details */}
          {step === 2 && (
            <form onSubmit={handleSubmitOrder}>
              <h2 className="text-lg font-bold text-white mb-6">Bước 2: Thông tin đăng ký khách hàng</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                  Mã giảm giá (Khuyến mãi)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: CLOUDSERVICE2026"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-white/5 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">
                  Ghi chú đơn hàng
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhu cầu bổ sung hoặc cấu hình đặc biệt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Pricing Summary Block */}
              <div className="bg-slate-950 border border-white/5 rounded-xl p-4 mb-8 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gói đã chọn:</span>
                  <span className="text-white font-bold">{selectedPlan.name}</span>
                </div>
                {selectedPlan.type === "VPS" && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hệ điều hành:</span>
                    <span className="text-white font-medium">{os}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Chu kỳ thanh toán:</span>
                  <span className="text-white">{billingCycle}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Mã giảm giá:</span>
                    <span>-{discountPercent}%</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
                  <span className="text-slate-400 font-bold">Tổng thanh toán:</span>
                  <span className="text-lg font-black text-blue-400">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 h-10 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
                >
                  ← Cấu hình gói
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 h-10 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Xác Nhận Đặt Hàng"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Order Success & payment QR */}
          {step === 3 && createdOrder && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-950 text-green-400 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                ✓
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Đăng Ký Đơn Hàng Thành Công!</h2>
              <p className="text-xs text-slate-400 mb-6">
                Mã đơn hàng: <strong className="text-slate-200 font-mono">{createdOrder.orderCode}</strong>. Quý khách vui lòng chuyển khoản thanh toán để hệ thống tự động khởi tạo.
              </p>

              {/* QR Code Graphic (SVG) */}
              <div className="bg-white p-4 rounded-xl w-44 h-44 mx-auto mb-6 flex items-center justify-center border border-slate-200">
                <svg className="w-36 h-36 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0 0h30v10H10v20H0zm0 100h30V90H10V70H0zm100-100H70v10h20v20h10zm0 100H70V90h20V70h10z" />
                  <path d="M15 15h10v10H15zm60 0h10v10H75zm0 60h10v10H75zm-30-30h10v10H45z" />
                  <path d="M35 15h10v5H35zm0 25h20v5H35zm25 15h10v15H60zm-20 20h15v5H40zm-15-5h10v5H25z" />
                  <path d="M5 45h5v15H5zm50-10h5v10h-5zm15-20h5v5h-5zm0 30h5v5h-5zm-15-5h5v5h-5z" />
                  <rect x="42" y="42" width="16" height="16" fill="#1e3a8a" rx="2" />
                  <text x="50" y="53" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">CS</text>
                </svg>
              </div>

              {/* Payment details table */}
              <div className="max-w-md mx-auto bg-slate-950 border border-white/5 rounded-xl p-4 text-left text-xs space-y-2 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                  <span className="text-white font-semibold">MB BANK (Ngân hàng Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="text-white font-mono font-bold">1900 8888 6666</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="text-white font-semibold">CONG TY CP CLOUDSERVICE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nội dung chuyển khoản:</span>
                  <span className="text-yellow-400 font-mono font-bold">PAY {createdOrder.orderCode}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-slate-400">Số tiền:</span>
                  <span className="text-blue-400 font-extrabold font-mono">{formatPrice(createdOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    alert("Cảm ơn bạn đã lựa chọn dịch vụ của CloudService. Hóa đơn của bạn đã chuyển vào trạng thái chờ kích hoạt.");
                    setStep(1);
                    setCreatedOrder(null);
                  }}
                  className="px-6 h-10 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
                >
                  Về trang đặt hàng
                </button>
                <a
                  href="/"
                  className="px-6 h-10 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  Quay lại Trang Chủ
                </a>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Đang tải trang đặt hàng...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
