"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getAccessToken } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

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

  // Shopee-style Voucher State
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [modalSearchCode, setModalSearchCode] = useState("");
  const [modalSelectedPromo, setModalSelectedPromo] = useState<any | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeConditionId, setActiveConditionId] = useState<number | null>(null);

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
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây
  const [isExpired, setIsExpired] = useState(false);

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

    // Lắng nghe SignalR nếu có sự thay đổi về gói dịch vụ
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "price" || entity === "all") {
        fetchPlan();
      }
    });

    return () => unsubscribe();
  }, [planIdParam]);

  // 3. Tải danh sách Voucher/Khuyến mãi đang khả dụng (Shopee style)
  useEffect(() => {
    async function loadVouchers() {
      try {
        const res = await apiFetch("/api/promotions?activeOnly=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const now = Date.now();
            const active = data.filter((p: any) => {
              if (p.isActive === false) return false;
              const start = p.startDate ? new Date(p.startDate).getTime() : 0;
              const end = p.endDate ? new Date(p.endDate).getTime() : Infinity;
              return now >= start && now <= end;
            });
            setAvailableVouchers(active);
          }
        }
      } catch (err) {
        console.warn("Lỗi tải voucher:", err);
      }
    }
    loadVouchers();
  }, []);

  // Đếm ngược 5 phút khi ở bước thanh toán PayOS
  useEffect(() => {
    if (step !== 2 || paymentSuccess || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, paymentSuccess, isExpired]);

  // Polling kiểm tra trạng thái đơn hàng mỗi 3 giây khi ở bước thanh toán PayOS
  useEffect(() => {
    if (step !== 2 || paymentSuccess || isExpired || !createdOrder?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/order-requests/${createdOrder.id}`);
        if (res.ok) {
          const order = await res.json();
          if (order.status === 2) {
            setPaymentSuccess(true);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.warn("Lỗi kiểm tra trạng thái thanh toán:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [step, paymentSuccess, isExpired, createdOrder]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const activeCycle = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[3];

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

  // Áp dụng mã trong Shopee Voucher Modal
  const handleApplyModalCode = async () => {
    const code = modalSearchCode.trim();
    if (!code) {
      setModalError("Vui lòng nhập mã voucher.");
      return;
    }
    setPromoLoading(true);
    setModalError(null);
    try {
      const res = await apiFetch(`/api/promotions/validate/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setModalSelectedPromo(data);
        if (!availableVouchers.some((v) => v.id === data.id)) {
          setAvailableVouchers((prev) => [data, ...prev]);
        }
        setModalSearchCode("");
      } else {
        const errorData = await res.json().catch(() => null);
        setModalError(errorData?.message || "Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.");
      }
    } catch {
      setModalError("Lỗi kết nối kiểm tra mã voucher.");
    } finally {
      setPromoLoading(false);
    }
  };

  // Xác nhận chọn Voucher (Đồng ý)
  const handleConfirmVoucherSelection = () => {
    if (modalSelectedPromo) {
      setPromoCode(modalSelectedPromo.name);
      setDiscountPercent(Number(modalSelectedPromo.discountPercentage) || 0);
      setAppliedPromoName(modalSelectedPromo.name);
      setPromoMessage({
        type: "success",
        text: `Đã áp dụng voucher ${modalSelectedPromo.name}! Giảm ${modalSelectedPromo.discountPercentage}% tổng đơn hàng.`
      });
    } else {
      setPromoCode("");
      setDiscountPercent(0);
      setAppliedPromoName("");
      setPromoMessage(null);
    }
    setIsVoucherModalOpen(false);
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

    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      const payload = {
        planId: plan?.id,
        planName: plan?.name,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone,
        billingCycle: activeCycle.id,
        promoCode,
        notes: `${notes || ""}${promoCode ? ` [Mã KM: ${promoCode} (-${discountPercent}%)]` : ""}${domainName ? ` [Tên miền: ${domainName}]` : ""} [Tổng tiền: ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ]`.trim(),
        totalAmount
      };

      const res = await apiFetch("/api/order-requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Không thể tạo đơn hàng. Vui lòng thử lại!");
      }

      const orderData = await res.json();
      setCreatedOrder(orderData);

      // Gọi API khởi tạo cổng thanh toán PayOS
      try {
        const payosRes = await apiFetch(`/api/payment/create-payment-link/${orderData.id}`, {
          method: "POST"
        });
        if (payosRes.ok) {
          const payosResult = await payosRes.json();
          setPayosData(payosResult);
        } else {
          setPayosData({
            amount: totalAmount,
            orderCode: orderData.id,
            description: `CloudService #${orderData.id}`,
            accountNumber: "0345678999",
            accountName: "CONG TY CLOUDSERVICE VN",
            bin: "970422",
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tomhum07.me/pay/${orderData.id}`
          });
        }
      } catch (payosErr) {
        console.warn("Lỗi tạo link PayOS:", payosErr);
        setPayosData({
          amount: totalAmount,
          orderCode: orderData.id,
          description: `CloudService #${orderData.id}`,
          accountNumber: "0345678999",
          accountName: "CONG TY CLOUDSERVICE VN",
          bin: "970422",
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tomhum07.me/pay/${orderData.id}`
        });
      }

      // Chuyển sang Step 2 (Màn hình quét mã PayOS)
      setStep(2);
      setTimeLeft(300);
      setIsExpired(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setValidationError(err.message || "Có lỗi xảy ra khi tạo đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // Nút xác nhận thanh toán thủ công
  const handleManualCheckPayment = async () => {
    if (!createdOrder?.id) return;
    setCheckingPayment(true);
    setPaymentError(null);
    try {
      const res = await apiFetch(`/api/payment/check-status/${createdOrder.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 2 || data.isPaid || data.status === "PAID") {
          setPaymentSuccess(true);
        } else {
          setPaymentError("Hệ thống chưa nhận được khoản chuyển khoản. Vui lòng chờ 1-2 phút hoặc kiểm tra lại nội dung chuyển.");
        }
      } else {
        const directRes = await apiFetch(`/api/order-requests/${createdOrder.id}`);
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.status === 2) {
            setPaymentSuccess(true);
            return;
          }
        }
        setPaymentError("Đang đồng bộ giao dịch với ngân hàng... Vui lòng thử lại sau vài giây.");
      }
    } catch {
      setPaymentError("Không thể kết nối đến cổng thanh toán. Hãy thử bấm kiểm tra lại.");
    } finally {
      setCheckingPayment(false);
    }
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin gói dịch vụ & bảng giá...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy gói dịch vụ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gói cước bạn chọn có thể đã bị ẩn hoặc ngừng cung cấp. Vui lòng quay lại trang bảng giá để chọn gói khác.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm"
          >
            ← Xem Bảng Giá Dịch Vụ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Step Indicator Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>HỆ THỐNG ĐĂNG KÝ &amp; KÍCH HOẠT DỊCH VỤ TỰ ĐỘNG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {step === 1 ? "Khởi Tạo Dịch Vụ & Cấu Hình" : "Thanh Toán Tự Động PayOS QR Code"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {step === 1
              ? "Hoàn tất các bước đăng ký để kích hoạt hạ tầng máy chủ trong 60 giây."
              : "Quét mã QR bằng ứng dụng Ngân Hàng hoặc Ví Điện Tử để hoàn tất thanh toán tự động."}
          </p>
        </div>

        {/* Progress Bar Steps */}
        <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "bg-slate-200 text-slate-600"
            }`}>
              1
            </div>
            <span className="text-xs font-bold text-slate-900">Thông Tin &amp; Gói Cước</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 2 ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "bg-slate-200 text-slate-600"
            }`}>
              2
            </div>
            <span className={`text-xs font-bold ${step === 2 ? "text-slate-900" : "text-slate-400"}`}>
              Quét Mã PayOS QR
            </span>
          </div>
        </div>

        {/* BƯỚC 1: ĐIỀN THÔNG TIN & CHỌN CHU KỲ */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cột Trái: Biểu Mẫu Điền Thông Tin */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Alert nếu chưa đăng nhập */}
              {!isLoggedIn && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
                  <span className="text-base">💡</span>
                  <div>
                    <span className="font-bold">Mẹo:</span> Bạn chưa đăng nhập.{" "}
                    <Link
                      href={`/login?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "")}`}
                      className="font-bold underline text-amber-900 hover:text-blue-600"
                    >
                      Đăng nhập ngay
                    </Link>{" "}
                    để tự động điền hồ sơ và quản lý gói cước trong trang cá nhân.
                  </div>
                </div>
              )}

              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-6">
                
                {/* 1. Chọn Chu Kỳ Thanh Toán */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Chọn Chu Kỳ Thanh Toán</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {BILLING_CYCLES.map((cycle) => {
                      const isSelected = billingCycle === cycle.id;
                      return (
                        <div
                          key={cycle.id}
                          onClick={() => setBillingCycle(cycle.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-blue-50/60 border-blue-600 shadow-sm ring-1 ring-blue-600"
                              : "bg-slate-50 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-slate-900">{cycle.label}</span>
                              {cycle.tag && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  {cycle.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {cycle.discount > 0 ? `Giảm ${cycle.discount}% giá gốc` : "Giá niêm yết"}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Chu kỳ {cycle.months} tháng</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Thông tin khách hàng */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Thông Tin Khách Hàng / Đăng Ký</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Nhận Bàn Giao *</label>
                      <input
                        type="email"
                        required
                        placeholder="email@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Số Điện Thoại / Zalo *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tên Miền Gắn Với Dịch Vụ (Nếu có)</label>
                      <input
                        type="text"
                        placeholder="domaincuaban.vn"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ghi Chú Kỹ Thuật (OS, Cấu hình đặc thù...)</label>
                    <textarea
                      rows={2}
                      placeholder="VD: Cài đặt hệ điều hành Ubuntu 22.04 LTS hoặc Windows Server 2022..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    ></textarea>
                  </div>
                </div>

                {/* 3. SHOPEE-STYLE VOUCHER SELECTOR BAR */}
                <div
                  onClick={() => {
                    const match = availableVouchers.find((v) => v.name.toLowerCase() === promoCode.toLowerCase());
                    setModalSelectedPromo(match || (discountPercent > 0 ? { name: appliedPromoName, discountPercentage: discountPercent } : null));
                    setModalError(null);
                    setIsVoucherModalOpen(true);
                  }}
                  className="p-4 rounded-3xl bg-white border border-orange-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">CloudService Voucher</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          {availableVouchers.length > 0 ? `${availableVouchers.length} Mã Khả Dụng` : "Nhập Mã"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {discountPercent > 0 ? (
                          <span className="text-emerald-600 font-bold">
                            ✓ Đã áp dụng mã: {appliedPromoName} (Giảm {discountPercent}%)
                          </span>
                        ) : (
                          "Chọn hoặc nhập mã Shopee / CloudService Voucher >"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                    <span>{discountPercent > 0 ? `Đổi Voucher` : "Chọn Voucher"}</span>
                    <span className="text-sm font-black">›</span>
                  </div>
                </div>

                {/* Promo Notification if any */}
                {promoMessage && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 ${
                      promoMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {promoMessage.type === "success" ? (
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{promoMessage.text}</span>
                    </div>
                    {discountPercent > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPromoCode("");
                          setDiscountPercent(0);
                          setAppliedPromoName("");
                          setPromoMessage(null);
                        }}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Bỏ Mã
                      </button>
                    )}
                  </div>
                )}

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
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-24 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">
                    {plan.categoryName || "Gói Dịch Vụ"}
                  </span>
                  <h2 className="text-xl font-black text-slate-900">{plan.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{plan.description || "Hạ tầng đám mây chuyên nghiệp"}</p>
                </div>

                {/* Thông số kỹ thuật */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  {plan.cpu && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">Vi xử lý (CPU)</span>
                      <span className="font-semibold text-slate-900 font-mono">{plan.cpu}</span>
                    </div>
                  )}
                  {plan.ram && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">Bộ nhớ (RAM)</span>
                      <span className="font-semibold text-slate-900 font-mono">{plan.ram}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">Dung lượng ổ cứng</span>
                      <span className="font-semibold text-slate-900 font-mono">{plan.storage}</span>
                    </div>
                  )}
                  {plan.bandwidth && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">Băng thông mạng</span>
                      <span className="font-semibold text-slate-900">{plan.bandwidth}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Tường lửa Anti-DDoS</span>
                    <span className="font-semibold text-emerald-600">100Gbps Miễn Phí</span>
                  </div>
                </div>

                {/* Chi tiết thanh toán */}
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Chu kỳ đã chọn</span>
                    <span className="font-bold text-slate-900">{activeCycle.label}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tạm tính gói cước</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {new Intl.NumberFormat("vi-VN").format(calculateSubtotal())} đ
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-emerald-600">
                      <span>Voucher giảm ({appliedPromoName} -{discountPercent}%)</span>
                      <span className="font-mono font-bold">
                        -{new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * discountPercent) / 100)} đ
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Tổng Thanh Toán</div>
                      <div className="text-[10px] text-slate-400">Đã bao gồm VAT &amp; Kích hoạt tức thì</div>
                    </div>
                    <div className="text-2xl font-black text-blue-600 font-mono">
                      {new Intl.NumberFormat("vi-VN").format(calculateTotal())} đ
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* BƯỚC 2: MÀN HÌNH THANH TOÁN PAYOS QR */}
        {step === 2 && payosData && createdOrder && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in">
            
            {paymentSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-slate-900">Thanh Toán Thành Công!</h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Đơn hàng <strong>#{createdOrder.id}</strong> đã được hệ thống ghi nhận thành công. Thông tin tài khoản máy chủ đang được gửi tự động qua email <strong>{email}</strong>.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Link
                    href="/my-plans"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Xem Dịch Vụ Của Tôi →
                  </Link>
                  <Link
                    href="/"
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Trang Chủ
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header thanh toán & Countdown */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      MÃ ĐƠN HÀNG: #{createdOrder.id}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      Quét Mã VietQR / PayOS Để Thanh Toán
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                    <span className="text-xs font-medium">Thời gian giữ đơn:</span>
                    <span className="font-mono font-black text-sm text-amber-900">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                {isExpired && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
                    ⚠️ Phiên thanh toán đã hết hạn 5 phút. Vui lòng bấm &ldquo;Khởi tạo lại&rdquo; để tạo mã thanh toán mới.
                  </div>
                )}

                {/* QR Code & Banking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Cột Trái: Ảnh QR Code */}
                  <div className="text-center space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={payosData.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://tomhum07.me/pay/${createdOrder.id}`}
                        alt="PayOS QR Code"
                        className="w-56 h-56 mx-auto object-contain rounded-xl"
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Đang chờ chuyển khoản tự động...</span>
                    </div>
                  </div>

                  {/* Cột Phải: Thông tin Chuyển khoản chi tiết */}
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500">Số Tiền Thanh Toán:</span>
                      <span className="font-mono font-black text-blue-600 text-base">
                        {new Intl.NumberFormat("vi-VN").format(payosData.amount || calculateTotal())} đ
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Số Tài Khoản:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {payosData.accountNumber || "0345678999"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(payosData.accountNumber || "0345678999")}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                      >
                        Sao chép
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Chủ Tài Khoản:</span>
                        <span className="font-bold text-slate-900">
                          {payosData.accountName || "CONG TY CLOUDSERVICE VN"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex justify-between items-center">
                      <div>
                        <span className="text-amber-700 block text-[10px] font-bold">Nội Dung Chuyển Khoản:</span>
                        <span className="font-mono font-bold text-amber-900 text-sm">
                          {payosData.description || `CloudService #${createdOrder.id}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(payosData.description || `CloudService #${createdOrder.id}`)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-[11px] font-bold text-amber-900"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>

                </div>

                {paymentError && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center">
                    {paymentError}
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={checkingPayment}
                    onClick={handleManualCheckPayment}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {checkingPayment ? "Đang kiểm tra giao dịch..." : "Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    ← Quay Lại Sửa Thông Tin
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL CHỌN CLOUDSERVICE / SHOPEE VOUCHER (CHUẨN GIAO DIỆN SHOPEE)        */}
      {/* ========================================================================= */}
      {isVoucherModalOpen && (
        <div
          onClick={() => setIsVoucherModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header Shopee Voucher */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors text-lg"
                >
                  ←
                </button>
                <h3 className="text-base font-black text-slate-900">Chọn CloudService Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => alert("Chính sách voucher: Mỗi đơn hàng áp dụng tối đa 1 mã giảm giá cao nhất. Voucher sẽ tự động hết hạn khi quá thời gian hiệu lực.")}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center text-xs font-bold"
                title="Xem điều kiện sử dụng"
              >
                ?
              </button>
            </div>

            {/* Search Input Bar (Shopee Style) */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher giảm giá..."
                  value={modalSearchCode}
                  onChange={(e) => {
                    setModalSearchCode(e.target.value.toUpperCase());
                    if (modalError) setModalError(null);
                  }}
                  className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 uppercase"
                />
                <button
                  type="button"
                  disabled={promoLoading || !modalSearchCode.trim()}
                  onClick={handleApplyModalCode}
                  className="px-5 h-10 rounded-xl bg-slate-300 text-slate-700 hover:bg-orange-500 hover:text-white disabled:opacity-50 font-bold text-xs transition-colors"
                >
                  {promoLoading ? "..." : "Áp dụng"}
                </button>
              </div>
              {modalError && (
                <p className="text-[11px] text-rose-600 font-medium mt-2 flex items-center gap-1">
                  <span>⚠️</span> {modalError}
                </p>
              )}
            </div>

            {/* Voucher List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100/60">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800">Ưu Đãi Dành Riêng Cho Bạn</span>
                <span className="text-[11px] text-slate-400">{availableVouchers.length} voucher khả dụng</span>
              </div>

              {availableVouchers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Hiện chưa có voucher nào đang diễn ra. Bạn có thể nhập mã trực tiếp ở ô trên.
                </div>
              ) : (
                availableVouchers.map((v, idx) => {
                  const isSelected = modalSelectedPromo?.name?.toLowerCase() === v.name?.toLowerCase();
                  const isBestDeal = idx === 0;

                  return (
                    <div
                      key={v.id || idx}
                      onClick={() => {
                        if (isSelected) {
                          setModalSelectedPromo(null);
                        } else {
                          setModalSelectedPromo(v);
                        }
                      }}
                      className={`relative rounded-2xl bg-white border cursor-pointer transition-all duration-200 flex overflow-hidden shadow-xs hover:shadow-md ${
                        isSelected ? "border-orange-500 ring-1 ring-orange-500" : "border-slate-200 hover:border-orange-300"
                      }`}
                    >
                      {/* Left Ticket Stub (Shopee Teal/Green/Orange) */}
                      <div className="w-24 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-3 flex flex-col justify-between items-center text-center relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">
                          👑
                        </div>
                        <div className="font-black text-xs uppercase tracking-wider">VIP</div>
                        <div className="text-[9px] text-teal-100 font-medium">CloudService</div>

                        {/* Perforated Edge Dots Effect */}
                        <div className="absolute right-[-4px] top-0 bottom-0 flex flex-col justify-around">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-slate-100/60"></div>
                          ))}
                        </div>
                      </div>

                      {/* Right Ticket Details */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 text-xs leading-snug">
                              Giảm {v.discountPercentage}% cho đơn từ 0Đ
                            </h4>
                            {isBestDeal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white shrink-0 ml-1">
                                Lựa chọn tốt nhất
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-blue-600 font-semibold mb-2">
                            Mã: {v.name}
                          </div>

                          {/* Progress bar like Shopee */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-rose-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(95, 40 + ((idx * 23) % 55))}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>
                              {v.endDate ? `Hết hạn: ${new Date(v.endDate).toLocaleDateString("vi-VN")}` : "Đang áp dụng"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveConditionId(activeConditionId === v.id ? null : v.id);
                              }}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Điều kiện
                            </button>
                          </div>
                        </div>

                        {/* Condition Popup snippet */}
                        {activeConditionId === v.id && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 animate-in fade-in">
                            • Áp dụng cho mọi gói cước VPS, Hosting &amp; Combo.<br />
                            • Chiết khấu trực tiếp {v.discountPercentage}% tổng số tiền thanh toán.
                          </div>
                        )}
                      </div>

                      {/* Radio Checkbox on Right */}
                      <div className="pr-3.5 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? "bg-[#ee4d2d] text-white" : "border-2 border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Bar (Shopee Style) */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {modalSelectedPromo ? "1 Voucher đã được chọn" : "Chưa chọn voucher nào"}
                </span>
                {modalSelectedPromo && (
                  <span className="font-bold text-[#ee4d2d]">
                    Đã áp dụng giảm: -{new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * modalSelectedPromo.discountPercentage) / 100)} đ
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmVoucherSelection}
                className="w-full py-3.5 rounded-2xl bg-[#ee4d2d] hover:bg-[#d73211] text-white font-bold text-sm transition-colors shadow-md shadow-orange-500/20"
              >
                Đồng ý
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Đang chuẩn bị trang thanh toán...</p>
          </div>
        </div>
      }
    >
      <OrderFormContent />
    </Suspense>
  );
}
