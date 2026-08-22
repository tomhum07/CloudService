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

  // Voucher Selector Modal State (Phong cách đồng bộ website)
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

    // Lắng nghe SignalR để cập nhật gói cước tức thì nếu Admin sửa gói khi đang xem
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "price" || entity === "all") {
        fetchPlan();
      }
    });

    return () => unsubscribe();
  }, [planIdParam]);

  // 3. Polling tự động kiểm tra trạng thái thanh toán & Bộ đếm 5 phút tự động hủy giao dịch
  useEffect(() => {
    if (step !== 2 || !payosData?.orderCode || paymentSuccess || isExpired) return;

    // Bộ đếm lùi 5 phút (300 giây)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          // Tự động gửi lệnh hủy giao dịch lên PayOS & Cập nhật đơn hàng thành Đã hủy
          if (createdOrder?.id) {
            apiFetch(`/api/order-requests/${createdOrder.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: 3, notes: "Hệ thống: Tự động hủy đơn do quá hạn thanh toán 5 phút" })
            }).catch(() => {});
          }
          if (payosData?.orderCode) {
            apiFetch(`/api/payment/cancel/${payosData.orderCode}`, {
              method: "POST"
            }).catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling kiểm tra trạng thái thanh toán định kỳ 3 giây
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
            clearInterval(timer);

            // Tự động kích hoạt đơn hàng trong DB khi polling phát hiện đã trả tiền thành công
            if (createdOrder?.id) {
              apiFetch(`/api/order-requests/${createdOrder.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: 2, notes: `Đã thanh toán thành công qua PayOS [Mã giao dịch: ${payosData.orderCode}]` })
              }).catch(() => {});
            }
          }
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, [step, payosData, paymentSuccess, isExpired, createdOrder]);

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
          // Đảm bảo cập nhật trạng thái đơn hàng trong DB thành Completed nếu chưa cập nhật
          if (createdOrder?.id) {
            apiFetch(`/api/order-requests/${createdOrder.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: 2, notes: `Đã thanh toán thành công qua PayOS [Mã giao dịch: ${payosData.orderCode}]` })
            }).catch(() => {});
          }
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
        const errorData = await res.json().catch(() => null);
        setDiscountPercent(0);
        setAppliedPromoName("");
        setPromoMessage({
          type: "error",
          text: errorData?.message || "Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng."
        });
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

  // Tải danh sách khuyến mãi đang còn hiệu lực
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

  const handleApplyModalCode = async () => {
    const code = modalSearchCode.trim();
    if (!code) {
      setModalError("Vui lòng nhập mã giảm giá.");
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
      setModalError("Không thể kết nối đến máy chủ.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleConfirmVoucherSelection = () => {
    if (modalSelectedPromo) {
      setPromoCode(modalSelectedPromo.name);
      setDiscountPercent(Number(modalSelectedPromo.discountPercentage) || 0);
      setAppliedPromoName(modalSelectedPromo.name);
      setPromoMessage({
        type: "success",
        text: `Áp dụng mã ${modalSelectedPromo.name} thành công! Giảm ${modalSelectedPromo.discountPercentage}% tổng giá trị.`
      });
    } else {
      setPromoCode("");
      setDiscountPercent(0);
      setAppliedPromoName("");
      setPromoMessage(null);
    }
    setIsVoucherModalOpen(false);
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
              setPaymentError(null);
            } else {
              const errData = await payRes.json().catch(() => ({}));
              const msg = errData.message || "Cổng thanh toán PayOS chưa được cấu hình API Key trên máy chủ backend.";
              console.warn("PayOS Link Generation Warning:", msg);
              setPaymentError(msg);
            }
          } catch (payErr: any) {
            console.warn("PayOS Link Generation Warning:", payErr);
            setPaymentError(payErr?.message || "Không thể kết nối cổng PayOS.");
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
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
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
                    <div className="w-10 h-10 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
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
                  <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleProceedToPayment} className="space-y-6">
                
                {/* 1. Chu kỳ thanh toán */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
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
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Mã Ưu Đãi / Khuyến Mãi</span>
                    </h3>
                    {discountPercent > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Đang giảm {discountPercent}% ({appliedPromoName})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã (VD: KHUYENMAI2026, GIAM20...)"
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
                          {promoLoading ? "..." : "Áp Dụng"}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const currentSelected = availableVouchers.find((v) => v.name.toLowerCase() === promoCode.toLowerCase());
                        setModalSelectedPromo(currentSelected || (discountPercent > 0 ? { name: appliedPromoName, discountPercentage: discountPercent } : null));
                        setModalError(null);
                        setIsVoucherModalOpen(true);
                      }}
                      className="px-4 h-11 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors border border-blue-200 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      <span>Chọn Voucher {availableVouchers.length > 0 ? `(${availableVouchers.length})` : ""}</span>
                    </button>
                  </div>

                  {promoMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        promoMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {promoMessage.type === "success" ? (
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
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
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Vi xử lý (CPU):</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.cpu}</span>
                    </div>
                  )}
                  {plan.ram && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Bộ nhớ (RAM):</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.ram}</span>
                    </div>
                  )}
                  {plan.storage && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Lưu trữ:</span>
                      <span className="font-semibold text-slate-900 font-mono text-[11px]">{plan.storage}</span>
                    </div>
                  )}
                  {plan.bandwidth && (
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Băng thông:</span>
                      <span className="font-semibold text-slate-900">{plan.bandwidth}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-700 pt-0.5">
                    <span className="text-slate-500 font-medium">Tường lửa:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Anti-DDoS 100Gbps
                    </span>
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
        {/* STEP 2: BƯỚC THANH TOÁN (HIỂN THỊ MÃ QR HOẶC KẾT QUẢ THÀNH CÔNG) */}
        {/* ========================================================= */}
        {step === 2 && createdOrder && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            
            {/* GIAO DIỆN KHI GIAO DỊCH HẾT HẠN (QUÁ 5 PHÚT) */}
            {isExpired ? (
              <div className="bg-rose-50 border border-rose-300 rounded-3xl p-10 text-center space-y-4 shadow-sm animate-in zoom-in-95 my-6">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-600/30">
                  ✕
                </div>
                <h2 className="text-2xl font-black text-rose-950 tracking-tight">Giao Dịch Đã Hết Hạn!</h2>
                <p className="text-xs text-rose-800/90 max-w-md mx-auto leading-relaxed">
                  Đã quá thời gian chờ thanh toán (5 phút). Đơn hàng <strong>{createdOrder.orderCode}</strong> đã được hệ thống tự động hủy để đảm bảo an toàn giao dịch.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setTimeLeft(300);
                      setIsExpired(false);
                      setStep(1);
                    }}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Đặt Hàng Lại Gói Này</span>
                  </button>
                  <Link
                    href="/pricing"
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all inline-block"
                  >
                    Xem Các Gói Khác
                  </Link>
                </div>
              </div>
            ) : paymentSuccess ? (
              /* GIAO DIỆN KHI THANH TOÁN THÀNH CÔNG (HÌNH 2) */
              <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-10 text-center space-y-4 shadow-sm animate-in zoom-in-95 my-6">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-600/30">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Thanh Toán Thành Công!</h2>
                <p className="text-xs text-emerald-800/90 max-w-md mx-auto leading-relaxed">
                  Hệ thống PayOS đã tự động xác nhận thanh toán cho đơn hàng <strong>{createdOrder.orderCode}</strong>. Dịch vụ của bạn đã được kích hoạt thành công!
                </p>
                <div className="pt-4">
                  <Link
                    href="/my-plans"
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all inline-block hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Truy Cập Gói Dịch Vụ Của Tôi Ngay →
                  </Link>
                </div>
              </div>
            ) : (
              /* GIAO DIỆN KHI ĐANG CHỜ THANH TOÁN (HÌNH 1) */
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-center space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                      ĐANG CHỜ THANH TOÁN QUÉT MÃ QR
                    </div>
                    {/* Đồng hồ đếm ngược 5 phút */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 rounded-full font-mono text-xs font-bold text-rose-600 shadow-xs">
                      <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Hết hạn sau: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-left sm:text-center">
                    Mở ứng dụng Ngân hàng bất kỳ để quét mã QR bên dưới, hệ thống sẽ tự động duyệt ngay sau khi chuyển khoản.
                  </p>
                </div>

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
                    
                    {payosData?.accountNumber || payosData?.qrCode ? (
                      <>
                        {/* Khung chứa ảnh QR Code thật từ PayOS */}
                        <div className="inline-block p-4 bg-white border border-slate-200 rounded-3xl shadow-sm relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              payosData.accountNumber
                                ? `https://img.vietqr.io/image/${payosData.bin || "970422"}-${payosData.accountNumber}-compact2.png?amount=${Math.round(payosData.amount || createdOrder?.totalAmount || 0)}&addInfo=${encodeURIComponent(payosData.description || createdOrder?.orderCode || "")}&accountName=${encodeURIComponent(payosData.accountName || "")}`
                                : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCode || "")}`
                            }
                            alt="PayOS Payment QR Code"
                            className="w-56 h-56 mx-auto object-contain rounded-xl"
                          />
                          <div className="text-[10px] text-slate-500 font-bold uppercase mt-2.5 tracking-wider flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>VietQR PayOS Tự Động 24/7 (Quét Bằng Mọi Ngân Hàng)</span>
                          </div>
                        </div>

                        {/* Bảng Chi Tiết Thông Tin Chuyển Khoản Trực Tiếp */}
                        <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2.5">
                          {payosData.accountName && (
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-slate-500">Chủ tài khoản:</span>
                              <span className="font-bold text-slate-900 uppercase">
                                {payosData.accountName}
                              </span>
                            </div>
                          )}

                          {payosData.accountNumber && (
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-slate-500">Số tài khoản:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 text-sm">
                                  {payosData.accountNumber}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-slate-500">Số tiền:</span>
                            <span className="font-black text-rose-600">
                              {new Intl.NumberFormat("vi-VN").format(createdOrder.totalAmount)} đ
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Nội dung chuyển khoản:</span>
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                              {payosData.description || createdOrder.orderCode}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Trường hợp chưa nhận được PayOS Data do chưa cấu hình key trên server */
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h4 className="text-xs font-bold text-amber-900">
                          Chưa Khởi Tạo Được Cổng Thanh Toán PayOS
                        </h4>
                        <p className="text-[11px] text-amber-700 max-w-md mx-auto leading-relaxed">
                          {paymentError || "Hệ thống máy chủ chưa cấu hình bộ khóa API (ClientId, ApiKey, ChecksumKey) cho cổng thanh toán PayOS."}
                        </p>
                      </div>
                    )}

                    {/* Thông báo lỗi khi kiểm tra giao dịch */}
                    {paymentError && payosData && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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
                        className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {checkingPayment ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Đang Kiểm Tra Với Hệ Thống Ngân Hàng PayOS...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
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
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      ← Chỉnh Sửa Thông Tin Đơn Hàng
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

      {/* MODAL CHỌN MÃ ƯU ĐÃI / VOUCHER (ĐỒNG BỘ 100% GIAO DIỆN WEBSITE) */}
      {isVoucherModalOpen && (
        <div
          onClick={() => setIsVoucherModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chọn Mã Giảm Giá</h3>
                  <p className="text-[10px] text-slate-500">Ưu đãi áp dụng trực tiếp vào đơn hàng của bạn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors font-bold text-sm"
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Khung Nhập Mã */}
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
                  className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 uppercase"
                />
                <button
                  type="button"
                  disabled={promoLoading || !modalSearchCode.trim()}
                  onClick={handleApplyModalCode}
                  className="px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 font-bold text-xs transition-colors shadow-xs"
                >
                  {promoLoading ? "..." : "Áp Dụng"}
                </button>
              </div>
              {modalError && (
                <p className="text-[11px] text-rose-600 font-medium mt-2 flex items-center gap-1">
                  <span>⚠️</span> {modalError}
                </p>
              )}
            </div>

            {/* Danh Sách Vé Khuyến Mãi (Ticket Cards) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-800">Mã Khuyến Mãi Khả Dụng</span>
                <span className="text-[11px] text-slate-400 font-medium">{availableVouchers.length} mã khả dụng</span>
              </div>

              {availableVouchers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Hiện chưa có chương trình khuyến mãi nào khả dụng.
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
                        isSelected ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {/* Cuống vé bên trái (Sleek Slate/Dark Tone) */}
                      <div className="w-24 bg-slate-900 text-white p-3 flex flex-col justify-between items-center text-center relative shrink-0 border-r border-dashed border-slate-700">
                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">GIẢM GIÁ</span>
                        <div className="font-black text-sm tracking-tight text-blue-400 font-mono">
                          -{v.discountPercentage}%
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">VOUCHER</div>

                        {/* Lỗ khuyết bấm vé */}
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-slate-50 border border-slate-200"></div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-slate-50 border border-slate-200"></div>
                      </div>

                      {/* Chi tiết vé bên phải */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 text-xs leading-snug">
                              Giảm {v.discountPercentage}% cho đơn hàng
                            </h4>
                            {isBestDeal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0 ml-1">
                                Ưu đãi lớn nhất
                              </span>
                            )}
                          </div>

                          <div className="mb-2">
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70 inline-block">
                              {v.name}
                            </span>
                          </div>

                          {/* Thanh tiến độ tối giản */}
                          <div className="w-full bg-slate-100 rounded-full h-1 mb-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${Math.min(95, 45 + ((idx * 20) % 50))}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>
                              {v.endDate ? `HSD: ${new Date(v.endDate).toLocaleDateString("vi-VN")}` : "Đang áp dụng"}
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

                        {/* Chi tiết điều kiện popup */}
                        {activeConditionId === v.id && (
                          <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 animate-in fade-in">
                            • Giảm trực tiếp {v.discountPercentage}% tổng giá trị đơn hàng.<br />
                            • Áp dụng cho toàn bộ các chu kỳ thanh toán.
                          </div>
                        )}
                      </div>

                      {/* Radio Checkbox bên phải */}
                      <div className="pr-3.5 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? "bg-blue-600 text-white" : "border-2 border-slate-300"
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

            {/* Thanh Dưới Cùng (Bottom Action Bar) */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {modalSelectedPromo ? "1 Voucher đã được chọn" : "Chưa chọn voucher nào"}
                </span>
                {modalSelectedPromo && (
                  <span className="font-bold text-blue-600">
                    Đã áp dụng giảm: -{new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * modalSelectedPromo.discountPercentage) / 100)} đ
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmVoucherSelection}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
              >
                Đồng Ý Áp Dụng
              </button>
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
