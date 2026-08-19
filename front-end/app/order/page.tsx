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
  // Step 2: Bước Thanh Toán PayOS (Hiện mã QR trực tiếp ngay trong trang)
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
  const [appliedPromoName, setAppliedPromoName] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  // Completed Order & PayOS State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [payosData, setPayosData] = useState<{
    checkoutUrl?: string;
    qrCode?: string;
    accountNumber?: string;
    accountName?: string;
    bin?: string;
    description?: string;
    amount?: number;
    orderCode?: number;
  } | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  // 3. Polling tự động kiểm tra trạng thái thanh toán khi ở Step 2
  useEffect(() => {
    if (step !== 2 || !payosData?.orderCode || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/payment/info/${payosData.orderCode}`);
        if (res.ok) {
          const data = await res.json();
          const st = data.status || (data.data && data.data.status);
          if (st === "PAID" || st === "COMPLETED") {
            setPaymentSuccess(true);
            setPaymentError(null);
            clearInterval(interval);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [step, payosData, paymentSuccess]);

  // Hàm thủ công kiểm tra kết quả giao dịch
  const handleCheckPaymentStatus = async () => {
    if (!payosData?.orderCode) return;

    setCheckingPayment(true);
    setPaymentError(null);

    try {
      const res = await apiFetch(`/api/payment/info/${payosData.orderCode}`);
      if (res.ok) {
        const data = await res.json();
        const st = data.status || (data.data && data.data.status);

        if (st === "PAID" || st === "COMPLETED") {
          setPaymentSuccess(true);
          setPaymentError(null);
        } else if (st === "CANCELLED") {
          setPaymentError("Giao dịch này đã bị hủy hoặc hết thời gian thanh toán.");
        } else {
          setPaymentError("Hệ thống chưa ghi nhận tiền chuyển khoản. Nếu bạn vừa quét mã thành công, vui lòng chờ trong 5 - 10 giây rồi bấm Kiểm Tra Lại!");
        }
      } else {
        setPaymentError("Không thể kết nối đến máy chủ kiểm tra thanh toán. Vui lòng thử lại.");
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra trạng thái thanh toán:", err);
      setPaymentError("Không thể kết nối đến máy chủ kiểm tra thanh toán. Vui lòng thử lại.");
    } finally {
      setCheckingPayment(false);
    }
  };

  const activeCycle = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[3];

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoMessage({ type: "error", text: "Vui lòng nhập mã giảm giá." });
      setDiscountPercent(0);
      setAppliedPromoName("");
      return;
    }

    setPromoLoading(true);
    setPromoMessage(null);

    try {
      // 1. Gọi API xác thực mã giảm giá từ database
      const res = await apiFetch(`/api/promotions/validate/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const discount = Number(data.discountPercentage) || 0;
        setDiscountPercent(discount);
        setAppliedPromoName(data.name || code);
        setPromoMessage({
          type: "success",
          text: `Áp dụng mã ${data.name} thành công! Giảm ${discount}% tổng giá trị.`
        });
      } else {
        // Fallback kiểm tra các mã ưu đãi mặc định hệ thống
        const upperCode = code.toUpperCase();
        if (upperCode === "CLOUDSERVICE2026" || upperCode === "VIETNIX" || upperCode === "VIETTELIDC" || upperCode === "GIAMGIA10") {
          const discount = upperCode === "GIAMGIA10" ? 10 : 15;
          setDiscountPercent(discount);
          setAppliedPromoName(upperCode);
          setPromoMessage({
            type: "success",
            text: `Áp dụng mã ưu đãi ${upperCode} thành công! Giảm ${discount}% tổng giá trị.`
          });
        } else {
          setDiscountPercent(0);
          setAppliedPromoName("");
          setPromoMessage({
            type: "error",
            text: "Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng."
          });
        }
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra mã giảm giá:", err);
      // Fallback kiểm tra offline
      const upperCode = code.toUpperCase();
      if (upperCode === "CLOUDSERVICE2026" || upperCode === "VIETNIX" || upperCode === "VIETTELIDC") {
        setDiscountPercent(15);
        setAppliedPromoName(upperCode);
        setPromoMessage({
          type: "success",
          text: `Áp dụng mã ưu đãi ${upperCode} thành công! Giảm 15% tổng giá trị.`
        });
      } else {
        setDiscountPercent(0);
        setAppliedPromoName("");
        setPromoMessage({
          type: "error",
          text: "Mã giảm giá không hợp lệ hoặc máy chủ không phản hồi."
        });
      }
    } finally {
      setPromoLoading(false);
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
      notes: `${notes || ""}${promoCode ? ` [Mã KM: ${promoCode}]` : ""}${domainName ? ` [Tên miền: ${domainName}]` : ""} [Tổng tiền: ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ]`.trim(),
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

        // Tạo link thanh toán PayOS trực tiếp cho đơn hàng này với đúng số tiền đã giảm giá
        if (finalOrderId > 0) {
          try {
            const payRes = await apiFetch("/api/payment/create-link", {
              method: "POST",
              body: JSON.stringify({
                orderId: finalOrderId,
                amount: Math.round(totalAmount),
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
            Nhập thông tin liên hệ của bạn để tiến hành khởi tạo dịch vụ và thanh toán quét mã QR trực tiếp.
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
              Thanh Toán Quét Mã QR
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>🎁</span>
                      <span>Mã Ưu Đãi / Khuyến Mãi</span>
                    </h3>
                    {discountPercent > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Đang giảm {discountPercent}% ({appliedPromoName})
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã (VD: CLOUDSERVICE2026, GIAMGIA10...)"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        if (promoMessage) setPromoMessage(null);
                      }}
                      className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white uppercase"
                    />
                    {discountPercent > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPromoCode("");
                          setDiscountPercent(0);
                          setAppliedPromoName("");
                          setPromoMessage(null);
                        }}
                        className="px-4 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors border border-rose-200"
                      >
                        Hủy Mã
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={promoLoading || !promoCode.trim()}
                        onClick={handleApplyPromo}
                        className="px-5 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        {promoLoading ? "Đang kiểm tra..." : "Áp Dụng"}
                      </button>
                    )}
                  </div>

                  {promoMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        promoMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span>{promoMessage.type === "success" ? "✓" : "⚠️"}</span>
                      <span>{promoMessage.text}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? "Đang xử lý thông tin..." : "Tiến Hành Thanh Toán →"}
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
        {/* STEP 2: BƯỚC THANH TOÁN (HIỂN THỊ MÃ QR TRỰC TIẾP TRÊN TRANG) */}
        {/* ========================================================= */}
        {step === 2 && createdOrder && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            
            {/* Banner Thông Báo Khi Thanh Toán Thành Công */}
            {paymentSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-8 text-center space-y-3 shadow-md animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-600/30">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-emerald-900">Thanh Toán Thành Công!</h2>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Hệ thống PayOS đã tự động xác nhận thanh toán cho đơn hàng <strong>{createdOrder.orderCode}</strong>. Dịch vụ của bạn đã được kích hoạt thành công!
                </p>
                <div className="pt-4">
                  <Link
                    href="/my-plans"
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all inline-block"
                  >
                    Truy Cập Gói Dịch Vụ Của Tôi Ngay →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-center space-y-1 shadow-xs">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                  ĐANG CHỜ THANH TOÁN QUÉT MÃ QR
                </div>
                <p className="text-[11px] text-slate-500">
                  Mở ứng dụng Ngân hàng bất kỳ để quét mã QR bên dưới, hệ thống sẽ tự động duyệt ngay sau khi chuyển khoản.
                </p>
              </div>
            )}

            {/* Chi Tiết Hóa Đơn & Mã QR Tự Động Trực Tiếp */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-start pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Chi Tiết Đơn Hàng</span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{createdOrder.planName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Khách hàng: {createdOrder.customerName} ({createdOrder.customerPhone})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Số tiền cần trả</span>
                  <span className="text-2xl font-black text-blue-600">
                    {new Intl.NumberFormat("vi-VN").format(createdOrder.totalAmount)} đ
                  </span>
                </div>
              </div>

              {/* KHUNG HIỂN THỊ MÃ QR TRỰC TIẾP TRÊN TRANG */}
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center space-y-4">
                
                {/* Khung chứa ảnh QR Code */}
                <div className="inline-block p-4 bg-white border border-slate-200 rounded-3xl shadow-sm relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      payosData?.qrCode
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCode)}`
                        : `https://img.vietqr.io/image/MB-0333336666-compact2.png?amount=${createdOrder.totalAmount}&addInfo=${encodeURIComponent(payosData?.description || createdOrder.orderCode)}&accountName=CONG%20TY%20CLOUDSERVICE`
                    }
                    alt="Payment QR Code"
                    className="w-56 h-56 mx-auto object-contain rounded-xl"
                  />
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-wider">
                    ⚡ VietQR Chuyển Khoản Tự Động 24/7
                  </div>
                </div>

                {/* Bảng Chi Tiết Thông Tin Chuyển Khoản Trực Tiếp */}
                <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {payosData?.accountName || "CONG TY CLOUDSERVICE"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {payosData?.accountNumber || "0333336666"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-black text-rose-600">
                      {new Intl.NumberFormat("vi-VN").format(createdOrder.totalAmount)} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nội dung chuyển khoản:</span>
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      {payosData?.description || createdOrder.orderCode}
                    </span>
                  </div>
                </div>

                {/* Thông báo kết quả kiểm tra thanh toán thủ công */}
                {paymentError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>{paymentError}</span>
                    </div>
                  </div>
                )}

                {/* Nút Kiểm Tra Kết Quả Giao Dịch */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={checkingPayment}
                    onClick={handleCheckPaymentStatus}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {checkingPayment ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Đang Kiểm Tra Với Hệ Thống Ngân Hàng PayOS...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Tôi Đã Chuyển Khoản Thành Công - Kiểm Tra Kết Quả Giao Dịch</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Vui lòng giữ nguyên đúng nội dung chuyển khoản để hệ thống tự động nhận diện và kích hoạt gói ngay lập tức.
                </p>
              </div>

              {/* Nút Điều Hướng */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  ← Chỉnh Sửa Thông Tin
                </button>
                <Link
                  href="/my-plans"
                  className="flex-1 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs text-center transition-colors border border-blue-200"
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
