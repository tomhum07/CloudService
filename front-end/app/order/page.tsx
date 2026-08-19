"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getAccessToken } from "@/utils/api";

const BILLING_CYCLES = [
  { id: "Monthly", label: "1 Tháng", months: 1, discount: 0 },
  { id: "Quarterly", label: "3 Tháng", months: 3, discount: 5 },
  { id: "SemiAnnual", label: "6 Tháng", months: 6, discount: 10 },
  { id: "Yearly", label: "12 Tháng", months: 12, discount: 20, tag: "Tiết kiệm 20%" },
  { id: "Biennial", label: "24 Tháng", months: 24, discount: 30, tag: "Ưu đãi 30%" }
];

function OrderFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planIdParam = searchParams.get("planId");
  const cycleParam = searchParams.get("cycle");

  // Step 1: Điền thông tin đăng ký
  // Step 2: Bước Thanh Toán (Cổng PayOS & VietQR)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(true);
  const [plan, setPlan] = useState<any | null>(null);

  // Form Fields
  const [billingCycle, setBillingCycle] = useState<string>(cycleParam || "Yearly");
  const [domainName, setDomainName] = useState("");

  // Customer Info
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  // Completed Order & PayOS State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [payosData, setPayosData] = useState<{ checkoutUrl?: string; qrCode?: string } | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  // 1. Kiểm tra trạng thái Đăng Nhập & Tự động điền thông tin người dùng
  useEffect(() => {
    async function checkAuthAndLoadProfile() {
      const token = getAccessToken();
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      try {
        const res = await apiFetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.fullName) setFullName(data.fullName);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
        }
      } catch (err) {
        console.warn("Lỗi tải thông tin user:", err);
      }
    }
    checkAuthAndLoadProfile();
  }, []);

  // 2. Load trực tiếp thông tin gói cước người dùng đã chọn
  useEffect(() => {
    async function fetchPlan() {
      setPlanLoading(true);
      try {
        if (planIdParam) {
          const res = await apiFetch(`/api/service-plans/${planIdParam}`);
          if (res.ok) {
            const data = await res.json();
            setPlan(data);
          } else {
            const allRes = await apiFetch("/api/service-plans?pageSize=100");
            if (allRes.ok) {
              const allData = await allRes.json();
              const items = allData.items || allData;
              const found = items.find((p: any) => String(p.id) === String(planIdParam)) || items[0];
              setPlan(found);
            }
          }
        } else {
          const allRes = await apiFetch("/api/service-plans?pageSize=100");
          if (allRes.ok) {
            const allData = await allRes.json();
            const items = allData.items || allData;
            if (items && items.length > 0) setPlan(items[0]);
          }
        }
      } catch (err) {
        console.warn("Lỗi lấy thông tin gói cước:", err);
      } finally {
        setPlanLoading(false);
      }
    }
    fetchPlan();
  }, [planIdParam]);

  const activeCycle = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[3];

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "CLOUDSERVICE2026" || code === "VIETNIX" || code === "VIETTELIDC") {
      setDiscountPercent(15);
      alert("Áp dụng mã giảm giá thành công! Bạn được chiết khấu thêm 15% tổng giá trị đơn hàng.");
    } else {
      alert("Mã giảm giá không hợp lệ.");
      setDiscountPercent(0);
    }
  };

  const calculateSubtotal = () => {
    if (!plan) return 0;
    const prices = plan.prices || [];
    const exactCyclePrice = prices.find((pr: any) => pr.billingCycle === activeCycle.id)?.price;
    if (exactCyclePrice) return exactCyclePrice;

    const monthlyPrice = prices.find((pr: any) => pr.billingCycle === "Monthly")?.price || prices[0]?.price || 0;
    const rawTotal = monthlyPrice * activeCycle.months;
    const cycleDiscount = (rawTotal * activeCycle.discount) / 100;
    return rawTotal - cycleDiscount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const promoDiscount = (subtotal * discountPercent) / 100;
    return Math.max(0, subtotal - promoDiscount);
  };

  // Xử lý gửi đơn đặt hàng & Tự động gọi API tạo Link PayOS
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Yêu cầu đăng nhập nếu người dùng chưa đăng nhập
    const token = getAccessToken();
    if (!token) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setValidationError("Vui lòng điền đầy đủ Họ và Tên, Email và Số điện thoại.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError("Địa chỉ Email không đúng định dạng.");
      return;
    }

    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setValidationError("Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và có từ 10 - 11 chữ số).");
      return;
    }

    setLoading(true);
    const orderCode = "CS-" + Math.floor(100000 + Math.random() * 900000);
    const totalAmount = calculateTotal();

    const orderData = {
      planId: plan?.id || 0,
      planName: plan?.name || "Gói Dịch Vụ Cloud",
      billingCycle: activeCycle.label,
      customerName: trimmedName,
      customerEmail: trimmedEmail,
      customerPhone: trimmedPhone,
      domainName: domainName.trim() || undefined,
      promoCode,
      notes: `${notes || ""}${promoCode ? ` [Mã KM: ${promoCode}]` : ""}${domainName ? ` [Tên miền: ${domainName}]` : ""}`.trim(),
      totalAmount,
      createdAt: new Date().toISOString(),
      orderCode,
      id: 0
    };

    try {
      const res = await apiFetch("/api/order-requests", {
        method: "POST",
        body: JSON.stringify({
          planId: plan?.id,
          planName: plan?.name,
          billingCycle: activeCycle.id,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: trimmedPhone,
          notes: orderData.notes
        })
      });

      if (res.ok) {
        const responseData = await res.json();
        const finalOrderId = responseData.id || 0;
        orderData.id = finalOrderId;
        orderData.orderCode = responseData.orderCode || orderData.orderCode;
        setCreatedOrder(orderData);

        // Tạo link thanh toán PayOS trực tiếp cho đơn hàng này
        if (finalOrderId > 0) {
          try {
            const payRes = await apiFetch("/api/payment/create-link", {
              method: "POST",
              body: JSON.stringify({
                orderId: finalOrderId,
                returnUrl: `${window.location.origin}/my-plans`,
                cancelUrl: `${window.location.origin}/pricing`
              })
            });
            if (payRes.ok) {
              const payData = await payRes.json();
              setPayosData(payData);
            }
          } catch (payErr) {
            console.warn("PayOS Link Generation Warning:", payErr);
          }
        }
      } else {
        setCreatedOrder(orderData);
      }
    } catch (err) {
      console.warn("Lỗi gửi đơn đặt hàng:", err);
      setCreatedOrder(orderData);
    }

    setLoading(false);
    setStep(2); // Chuyển sang bước Thanh Toán
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Không Tìm Thấy Gói Dịch Vụ</h1>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Gói dịch vụ bạn chọn không tồn tại hoặc đã tạm ngưng cung cấp.
        </p>
        <Link
          href="/pricing"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
        >
          ← Xem Bảng Giá Các Gói Khác
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            HỆ THỐNG ĐĂNG KÝ DỊCH VỤ TRỰC TUYẾN 24/7
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Đăng Ký Gói: <span className="text-blue-600">{plan.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Nhập thông tin liên hệ của bạn để tiến hành khởi tạo dịch vụ và chuyển đến bước thanh toán PayOS.
          </p>
        </div>

        {/* Progress Steps (2 Bước Tinh Gọn) */}
        <div className="flex items-center justify-center max-w-md mx-auto mb-10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-200 text-slate-600"
            }`}>
              1
            </div>
            <span className={`text-xs font-bold ${step >= 1 ? "text-blue-600" : "text-slate-400"}`}>
              Thông Tin Đăng Ký
            </span>
          </div>

          <div className={`w-16 h-0.5 mx-3 transition-colors ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`}></div>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" : "bg-slate-200 text-slate-600"
            }`}>
              2
            </div>
            <span className={`text-xs font-bold ${step >= 2 ? "text-blue-600" : "text-slate-400"}`}>
              Cổng Thanh Toán PayOS
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: NHẬP THÔNG TIN ĐĂNG KÝ */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột Trái: Form Nhập Thông Tin */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Box Cảnh Báo Nếu Chưa Đăng Nhập */}
              {!isLoggedIn && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Bạn chưa đăng nhập tài khoản</h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Đăng nhập giúp tự động điền thông tin và dễ dàng quản lý dịch vụ sau khi thanh toán.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/order")}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs text-center whitespace-nowrap transition-colors"
                  >
                    Đăng Nhập Ngay →
                  </Link>
                </div>
              )}

              {validationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-6">
                
                {/* 1. Chu kỳ thanh toán */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Chu Kỳ Thanh Toán</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BILLING_CYCLES.map((c) => {
                      const isSelected = billingCycle === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setBillingCycle(c.id)}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 shadow-sm"
                              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                          }`}
                        >
                          {c.tag && (
                            <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                              {c.tag}
                            </span>
                          )}
                          <div className="font-bold text-xs text-slate-900">{c.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {c.discount > 0 ? `Giảm ${c.discount}%` : "Giá tiêu chuẩn"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Thông tin khách hàng */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>📝</span>
                    <span>Thông Tin Người Đăng Ký</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Địa Chỉ Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="VD: user@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Số Điện Thoại *</label>
                      <input
                        type="tel"
                        required
                        placeholder="VD: 0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên Miền Cần Cấu Hình (Nếu có)</label>
                      <input
                        type="text"
                        placeholder="VD: mycompany.vn"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Ghi Chú Hoặc Yêu Cầu Kỹ Thuật Thêm</label>
                    <textarea
                      rows={2}
                      placeholder="VD: Cài đặt sẵn môi trường Node.js 20, MySQL 8.0, mở cổng 8080..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    ></textarea>
                  </div>
                </div>

                {/* 3. Mã giảm giá */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>🎁</span>
                    <span>Mã Ưu Đãi / Khuyến Mãi</span>
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã (VD: CLOUDSERVICE2026)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-5 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      Áp Dụng
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? "Đang xử lý thông tin..." : "Tiến Hành Thanh Toán (PayOS) →"}
                </button>
              </form>
            </div>

            {/* Cột Phải: Tóm Tắt Gói Dịch Vụ Đã Chọn */}
            <div>
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-24 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">
                    {plan.categoryName || "Gói Dịch Vụ"}
                  </span>
                  <h2 className="text-xl font-black text-slate-900">{plan.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{plan.description || "Hạ tầng đám mây chuyên nghiệp"}</p>
                </div>

                {/* Thông số kỹ thuật */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                  {plan.cpu && (
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">⚡ Vi xử lý (CPU):</span>
                      <span className="font-bold">{plan.cpu}</span>
                    </div>
                  )}
                  {plan.ram && (
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">💾 Bộ nhớ (RAM):</span>
                      <span className="font-bold">{plan.ram}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">💽 Ổ cứng lưu trữ:</span>
                      <span className="font-bold">{plan.storage}</span>
                    </div>
                  )}
                  {plan.bandwidth && (
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">🚀 Băng thông:</span>
                      <span className="font-bold">{plan.bandwidth}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">🛡️ Tường lửa:</span>
                    <span className="font-bold text-emerald-600">Anti-DDoS 100Gbps</span>
                  </div>
                </div>

                {/* Tính giá */}
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Thời hạn đăng ký:</span>
                    <span className="font-bold text-slate-900">{activeCycle.label}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính ({activeCycle.months} tháng):</span>
                    <span className="font-bold text-slate-900">
                      {new Intl.NumberFormat("vi-VN").format(calculateSubtotal())} đ
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Mã giảm giá ({discountPercent}%):</span>
                      <span>
                        - {new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * discountPercent) / 100)} đ
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Tổng Thanh Toán:</span>
                    <span className="text-2xl font-black text-blue-600">
                      {new Intl.NumberFormat("vi-VN").format(calculateTotal())} đ
                    </span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Link href="/pricing" className="text-xs font-semibold text-slate-400 hover:text-blue-600">
                    ← Chọn gói dịch vụ khác
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: BƯỚC THANH TOÁN (CỔNG PAYOS & VIETQR CHUYỂN KHOẢN) */}
        {/* ========================================================= */}
        {step === 2 && createdOrder && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
            
            {/* Banner Thông Báo */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl mx-auto shadow-md">
                ✓
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Đơn Đặt Hàng Đã Được Khởi Tạo Thành Công!</h2>
              <p className="text-xs text-emerald-700">
                Mã đơn hàng: <strong className="font-mono text-sm">{createdOrder.orderCode}</strong>
              </p>
            </div>

            {/* Chi Tiết Hóa Đơn & Thanh Toán */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Chi Tiết Hóa Đơn</span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{createdOrder.planName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Khách hàng: {createdOrder.customerName} ({createdOrder.customerPhone})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tổng tiền</span>
                  <span className="text-2xl font-black text-blue-600">
                    {new Intl.NumberFormat("vi-VN").format(createdOrder.totalAmount)} đ
                  </span>
                </div>
              </div>

              {/* Tùy chọn 1: Nút Thanh Toán Trực Tuyến PayOS */}
              {payosData?.checkoutUrl && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    🚀 THANH TOÁN TỰ ĐỘNG QUA PAYOS GATEWAY
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    Chuyển sang Cổng Thanh Toán PayOS (Quét QR hoặc Thẻ)
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Hệ thống sẽ tự động xác thực giao dịch và kích hoạt dịch vụ của bạn trong vòng vài giây.
                  </p>
                  <a
                    href={payosData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <span>Mở Cổng Thanh Toán PayOS Ngay</span>
                    <span>↗</span>
                  </a>
                </div>
              )}

              {/* Tùy chọn 2: Quét Mã VietQR Chuyển Khoản Trực Tiếp */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hoặc Quét Mã VietQR Chuyển Khoản Ngân Hàng 24/7
                </div>

                <div className="inline-block p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={payosData?.qrCode || `https://img.vietqr.io/image/MB-0333336666-compact2.png?amount=${createdOrder.totalAmount}&addInfo=${encodeURIComponent(createdOrder.orderCode)}&accountName=CONG%20TY%20CLOUDSERVICE`}
                    alt="Payment QR"
                    className="w-52 h-52 mx-auto object-contain"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-600 max-w-sm mx-auto">
                  <div>Ngân hàng: <strong>MBBank (Quân Đội)</strong></div>
                  <div>Số tài khoản: <strong className="font-mono text-blue-600">0333336666</strong></div>
                  <div>Nội dung chuyển khoản: <strong className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{createdOrder.orderCode}</strong></div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  ← Chỉnh Sửa Thông Tin
                </button>
                <Link
                  href="/my-plans"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors shadow-md shadow-blue-500/20"
                >
                  Xem Gói Dịch Vụ Của Tôi →
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
