"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, getAccessToken } from "@/utils/api";

const LINUX_OS_LIST = [
  { id: "ubuntu-24", name: "Ubuntu 24.04 LTS (Khuyên dùng)", group: "Linux" },
  { id: "ubuntu-22", name: "Ubuntu 22.04 LTS 64-bit", group: "Linux" },
  { id: "almalinux-9", name: "AlmaLinux 9.4 (Thay thế CentOS)", group: "Linux" },
  { id: "debian-12", name: "Debian 12 Bookworm", group: "Linux" },
  { id: "win-2022", name: "Windows Server 2022 Datacenter", group: "Windows" },
  { id: "win-2019", name: "Windows Server 2019 Standard", group: "Windows" }
];

const CONTROL_PANELS = [
  { id: "none", name: "Không cài đặt Control Panel (Hệ điều hành gốc)", price: 0 },
  { id: "aapanel", name: "aaPanel Free (Giao diện web trực quan, dễ dùng)", price: 0 },
  { id: "cyberpanel", name: "CyberPanel OpenLiteSpeed (Tối ưu tốc độ cao)", price: 0 },
  { id: "cpanel", name: "cPanel Official License (Doanh nghiệp)", price: 350000 },
  { id: "directadmin", name: "DirectAdmin License", price: 150000 }
];

const DATACENTERS = [
  { id: "hn-tier3", name: "Hà Nội - VNPT / Viettel IDC Tier 3 (Miền Bắc)", ping: "< 1ms" },
  { id: "hcm-tier3", name: "TP. Hồ Chí Minh - FPT Datacenter Tier 3 (Miền Nam)", ping: "< 1ms" }
];

const BILLING_CYCLES = [
  { id: "Monthly", label: "1 Tháng", months: 1, discount: 0, tag: "" },
  { id: "Quarterly", label: "3 Tháng", months: 3, discount: 5, tag: "Tiết kiệm 5%" },
  { id: "SemiAnnual", label: "6 Tháng", months: 6, discount: 10, tag: "Tiết kiệm 10%" },
  { id: "Yearly", label: "12 Tháng", months: 12, discount: 20, tag: "Tặng 20% (Khuyên dùng)" },
  { id: "Biennial", label: "24 Tháng", months: 24, discount: 30, tag: "Ưu đãi lớn 30%" }
];

function OrderFormContent() {
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("planId");
  const planTypeParam = searchParams.get("plan");
  const domainParam = searchParams.get("name");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);

  // Form Fields
  const [selectedPlanId, setSelectedPlanId] = useState<number | string>("");
  const [os, setOs] = useState<string>("Ubuntu 24.04 LTS (Khuyên dùng)");
  const [controlPanel, setControlPanel] = useState<string>("none");
  const [datacenter, setDatacenter] = useState<string>("hn-tier3");
  const [billingCycle, setBillingCycle] = useState<string>("Yearly");
  const [domainName, setDomainName] = useState(domainParam || "");

  // Customer Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  // Completed Order State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  // Auto load User Profile if logged in
  useEffect(() => {
    async function loadUserProfile() {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await apiFetch("/api/auth/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.fullName) setFullName(data.fullName);
            if (data.email) setEmail(data.email);
            if (data.phone) setPhone(data.phone);
          }
        } catch {}
      }
    }
    loadUserProfile();
  }, []);

  // Load plans from API
  useEffect(() => {
    async function fetchPlans() {
      setPlansLoading(true);
      try {
        const res = await apiFetch("/api/service-plans?pageSize=100");
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items
              .filter((p: any) => p.isActive !== false)
              .map((p: any) => {
                const prices = p.prices || [];
                const monthly = prices.find((pr: any) => pr.billingCycle === "Monthly")?.price || prices[0]?.price || 0;
                return {
                  id: p.id,
                  name: p.name,
                  category: p.categoryName || "Dịch Vụ Cloud",
                  type: p.categoryName?.toLowerCase().includes("host")
                    ? "Hosting"
                    : p.categoryName?.toLowerCase().includes("mail")
                    ? "Email"
                    : p.categoryName?.toLowerCase().includes("mật") || p.categoryName?.toLowerCase().includes("firewall")
                    ? "Firewall"
                    : "VPS",
                  price: monthly,
                  prices: prices,
                  cpu: p.cpu || "Tiêu chuẩn",
                  ram: p.ram || "Tiêu chuẩn",
                  storage: p.storage || "NVMe",
                  bandwidth: p.bandwidth || "1 Gbps",
                  qrCodeUrl: p.qrCodeUrl
                };
              });
            setPlans(mapped);
            if (mapped.length > 0 && !selectedPlanId) {
              setSelectedPlanId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch plans for order form:", err);
      } finally {
        setPlansLoading(false);
      }
    }
    fetchPlans();
  }, []);

  // Pre-select plan if passed from URL
  useEffect(() => {
    if (plans.length === 0) return;
    if (planIdParam) {
      const parsed = parseInt(planIdParam, 10);
      if (!isNaN(parsed) && plans.some(p => p.id === parsed)) {
        setSelectedPlanId(parsed);
      }
    } else if (planTypeParam) {
      const pType = planTypeParam.toLowerCase();
      const found = plans.find((p) => p.type.toLowerCase() === pType || p.category.toLowerCase().includes(pType));
      if (found) setSelectedPlanId(found.id);
    }
  }, [planIdParam, planTypeParam, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || {
    id: 0,
    name: "Gói dịch vụ",
    category: "Cloud",
    type: "VPS",
    price: 0,
    cpu: "-",
    ram: "-",
    storage: "-",
    bandwidth: "-"
  };

  const activeCycle = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[3];
  const selectedPanel = CONTROL_PANELS.find((cp) => cp.id === controlPanel) || CONTROL_PANELS[0];

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "CLOUDSERVICE2026" || code === "VIETNIX" || code === "VIETTELIDC") {
      setDiscountPercent(15);
      alert("Áp dụng mã giảm giá thành công! Bạn được chiết khấu thêm 15% tổng giá trị gói.");
    } else {
      alert("Mã giảm giá không hợp lệ.");
      setDiscountPercent(0);
    }
  };

  const calculateSubtotal = () => {
    // Check if the plan has specific cycle pricing from database
    const exactCyclePrice = selectedPlan.prices?.find((pr: any) => pr.billingCycle === activeCycle.id)?.price;
    if (exactCyclePrice) {
      return exactCyclePrice + selectedPanel.price * activeCycle.months;
    }
    const baseMonthly = selectedPlan.price + selectedPanel.price;
    const rawTotal = baseMonthly * activeCycle.months;
    const cycleDiscount = (rawTotal * activeCycle.discount) / 100;
    return rawTotal - cycleDiscount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const promoDiscount = (subtotal * discountPercent) / 100;
    return Math.max(0, subtotal - promoDiscount);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || selectedPlan.id === 0) {
      alert("Vui lòng chọn một gói dịch vụ để tiếp tục.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

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
    const orderData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      serviceType: selectedPlan.type,
      os: selectedPlan.type === "VPS" ? os : "N/A",
      controlPanel: selectedPanel.name,
      datacenter: DATACENTERS.find(d => d.id === datacenter)?.name || "Hà Nội Tier 3",
      domainName: domainName || undefined,
      billingCycle: activeCycle.label,
      customerName: trimmedName,
      customerEmail: trimmedEmail,
      customerPhone: trimmedPhone,
      promoCode,
      notes: `${notes || ""}${promoCode ? ` [Mã KM: ${promoCode}]` : ""}${selectedPlan.type === "VPS" ? ` [HĐH: ${os}] [Panel: ${selectedPanel.name}]` : ""}`.trim(),
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      orderCode: "CS-" + Math.floor(100000 + Math.random() * 900000)
    };

    try {
      const res = await apiFetch("/api/order-requests", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          billingCycle: activeCycle.id,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: trimmedPhone,
          notes: orderData.notes
        })
      });
      if (res.ok) {
        const responseData = await res.json();
        setCreatedOrder({
          ...orderData,
          orderCode: responseData.orderCode || orderData.orderCode,
          id: responseData.id
        });
      } else {
        setCreatedOrder(orderData);
      }
    } catch (err) {
      console.warn("API order submission error:", err);
      setCreatedOrder(orderData);
    }

    setLoading(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            HỆ THỐNG ĐẶT MUA TRỰC TUYẾN TỰ ĐỘNG
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Đăng Ký Khởi Tạo Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Hạ tầng Cloud VPS, Hosting và Bảo mật được thiết lập và bàn giao tự động ngay sau khi xác nhận thanh toán.
          </p>
        </div>

        {/* Steps Progress Indicator */}
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-10 px-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm" : "bg-slate-200 text-slate-500"
            }`}>1</div>
            <span className={`text-xs ${step >= 1 ? "text-slate-900 font-bold" : "text-slate-400"}`}>Cấu hình gói</span>
          </div>
          <div className="flex-1 h-[2px] bg-slate-200 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm" : "bg-slate-200 text-slate-500"
            }`}>2</div>
            <span className={`text-xs ${step >= 2 ? "text-slate-900 font-bold" : "text-slate-400"}`}>Thông tin liên hệ</span>
          </div>
          <div className="flex-1 h-[2px] bg-slate-200 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 3 ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm" : "bg-slate-200 text-slate-500"
            }`}>3</div>
            <span className={`text-xs ${step >= 3 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>Thanh toán</span>
          </div>
        </div>

        {/* STEP 1 & 2: TWO COLUMNS LAYOUT (Configurator + Sticky Summary) */}
        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Configuration Steps */}
            <div className="lg:col-span-2 space-y-6">
              
              {step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-6">
                  
                  {/* 1.1 Select Plan Card Grid */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                      Chọn Gói Cước Hạ Tầng
                    </h2>

                    {plansLoading ? (
                      <div className="p-8 text-center text-slate-400 text-xs">Đang tải danh sách gói cước từ cơ sở dữ liệu...</div>
                    ) : plans.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">Chưa có gói cước nào trong cơ sở dữ liệu.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {plans.map((p) => {
                          const isSelected = selectedPlanId === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPlanId(p.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/70 border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                  {p.category}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-1 mb-3">
                                <div><strong className="text-slate-700">CPU:</strong> {p.cpu}</div>
                                <div><strong className="text-slate-700">RAM:</strong> {p.ram} | <strong className="text-slate-700">Ổ cứng:</strong> {p.storage}</div>
                                <div><strong className="text-slate-700">Băng thông:</strong> {p.bandwidth}</div>
                              </div>
                              <div className="text-base font-extrabold text-blue-600">
                                {new Intl.NumberFormat("vi-VN").format(p.price)} đ <span className="text-[10px] text-slate-400 font-normal">/ tháng</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 1.2 Billing Cycles with Discounts */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                      Chu Kỳ Thanh Toán
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {BILLING_CYCLES.map((c) => {
                        const isSelected = billingCycle === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setBillingCycle(c.id)}
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                          >
                            <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>{c.label}</div>
                            {c.tag ? (
                              <span className={`text-[9px] font-bold block mt-1 ${isSelected ? "text-blue-100" : "text-emerald-600"}`}>{c.tag}</span>
                            ) : (
                              <span className={`text-[9px] block mt-1 ${isSelected ? "text-blue-200" : "text-slate-400"}`}>Giá chuẩn</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1.3 Datacenter & Location */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                      Vị Trí Trung Tâm Dữ Liệu (Datacenter Tier 3)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {DATACENTERS.map((dc) => {
                        const isSelected = datacenter === dc.id;
                        return (
                          <label
                            key={dc.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="datacenter"
                                checked={isSelected}
                                onChange={() => setDatacenter(dc.id)}
                                className="accent-blue-600"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">{dc.name}</div>
                                <div className="text-[10px] text-emerald-600 font-semibold">Độ trễ trung bình: {dc.ping}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1.4 Operating System (For VPS) */}
                  {selectedPlan.type === "VPS" && (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                        Hệ Điều Hành Máy Chủ (OS)
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {LINUX_OS_LIST.map((system) => {
                          const isSelected = os === system.name;
                          return (
                            <label
                              key={system.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="radio"
                                name="os"
                                checked={isSelected}
                                onChange={() => setOs(system.name)}
                                className="accent-blue-600"
                              />
                              <span className="text-xs font-medium text-slate-800">{system.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1.5 Control Panel Addon */}
                  {selectedPlan.type === "VPS" && (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                        Bảng Quản Trị Control Panel (Tùy chọn)
                      </h2>
                      <div className="space-y-2.5">
                        {CONTROL_PANELS.map((cp) => {
                          const isSelected = controlPanel === cp.id;
                          return (
                            <label
                              key={cp.id}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="controlPanel"
                                  checked={isSelected}
                                  onChange={() => setControlPanel(cp.id)}
                                  className="accent-blue-600"
                                />
                                <span className="text-xs font-medium text-slate-800">{cp.name}</span>
                              </div>
                              <span className="text-xs font-bold text-blue-600">
                                {cp.price === 0 ? "Miễn phí" : `+${new Intl.NumberFormat("vi-VN").format(cp.price)} đ/th`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Next Step Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                      Tiếp Tục: Điền Thông Tin Đăng Ký →
                    </button>
                  </div>

                </form>
              )}

              {/* STEP 2: Customer Contact Information */}
              {step === 2 && (
                <form onSubmit={handleStep2Submit} className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Bước 2: Thông Tin Khách Hàng</h2>
                    <p className="text-xs text-slate-500">
                      Thông tin truy cập máy chủ (IP, Root password, cPanel) sẽ được gửi tự động qua email này sau khi kích hoạt.
                    </p>
                  </div>

                  {validationError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      ⚠️ {validationError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Số Điện Thoại (Zalo) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Địa Chỉ Email Nhận Bàn Giao Dịch Vụ *</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên Miền Trỏ Về Dịch Vụ (Nếu có)</label>
                    <input
                      type="text"
                      placeholder="yourdomain.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Ghi Chú Hoặc Yêu Cầu Cài Đặt Thêm</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Cần hỗ trợ mở port 8080, cài sẵn Docker hoặc chuyển dữ liệu từ hosting cũ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      ← Quay Lại Cấu Hình
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                      {loading ? "Đang xử lý khởi tạo..." : "Xác Nhận & Tiến Hành Thanh Toán →"}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Right: Sticky Order Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 p-6 rounded-2xl bg-white border border-slate-200 shadow-md">
                <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Tóm Tắt Đơn Hàng</span>
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">1 Dịch vụ</span>
                </h3>

                <div className="space-y-3.5 text-xs pb-4 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{selectedPlan.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{selectedPlan.category}</div>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Chu kỳ thanh toán:</span>
                    <span className="font-bold text-slate-900">{activeCycle.label}</span>
                  </div>
                  {selectedPlan.type === "VPS" && (
                    <div className="flex justify-between text-slate-600">
                      <span>Hệ điều hành:</span>
                      <span className="font-medium text-slate-900 text-right truncate max-w-[140px]">{os}</span>
                    </div>
                  )}
                  {controlPanel !== "none" && (
                    <div className="flex justify-between text-slate-600">
                      <span>Control Panel:</span>
                      <span className="font-bold text-blue-600">{selectedPanel.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Vị trí máy chủ:</span>
                    <span className="font-medium text-slate-900">{datacenter === "hn-tier3" ? "Hà Nội Tier 3" : "TP.HCM Tier 3"}</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="py-4 border-b border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá (VD: VIETNIX)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 uppercase focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      Áp Dụng
                    </button>
                  </div>
                  {discountPercent > 0 && (
                    <div className="text-[11px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
                      <span>✓</span> Đã áp dụng chiết khấu {discountPercent}%
                    </div>
                  )}
                </div>

                {/* Pricing Calculation Breakdown */}
                <div className="py-4 space-y-2 text-xs border-b border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính ({activeCycle.months} tháng):</span>
                    <span className="font-semibold text-slate-800">{new Intl.NumberFormat("vi-VN").format((selectedPlan.price + selectedPanel.price) * activeCycle.months)} đ</span>
                  </div>
                  {activeCycle.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Giảm giá chu kỳ ({activeCycle.discount}%):</span>
                      <span>-{new Intl.NumberFormat("vi-VN").format(((selectedPlan.price + selectedPanel.price) * activeCycle.months * activeCycle.discount) / 100)} đ</span>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Mã khuyến mãi (-{discountPercent}%):</span>
                      <span>-{new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * discountPercent) / 100)} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Thuế VAT (0%):</span>
                    <span>0 đ</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 flex items-baseline justify-between mb-4">
                  <span className="text-sm font-bold text-slate-900">Tổng Thanh Toán:</span>
                  <span className="text-2xl font-black text-blue-600">
                    {new Intl.NumberFormat("vi-VN").format(calculateTotal())} đ
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                  🔒 Bảo mật thanh toán SSL 256-bit. Kích hoạt dịch vụ tức thì.
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* STEP 3: ORDER SUCCESS & PAYMENT INVOICE */
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 text-3xl flex items-center justify-center mx-auto mb-4 font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Đăng Ký Khởi Tạo Thành Công!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-8">
              Mã đơn hàng: <strong className="text-blue-600 font-mono text-sm">{createdOrder?.orderCode}</strong>. Email xác nhận và thông số truy cập máy chủ đã được gửi tới <strong className="text-slate-900">{createdOrder?.customerEmail}</strong>.
            </p>

            {/* Payment Details Box with VietQR */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-800">Thông Tin Chuyển Khoản Nhanh (VietQR 24/7)</span>
                <span className="text-sm font-black text-emerald-600">{new Intl.NumberFormat("vi-VN").format(createdOrder?.totalAmount || 0)} VNĐ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${createdOrder?.totalAmount || 150000}&addInfo=${encodeURIComponent(createdOrder?.orderCode || "CLOUDSERVICE")}&accountName=CLOUDSERVICE%20VIETNAM`}
                    alt="VietQR Payment"
                    className="w-48 h-48 object-contain"
                  />
                  <span className="text-[10px] text-slate-600 font-bold mt-1">Quét mã bằng App Ngân hàng bất kỳ</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngân hàng thụ hưởng:</span>
                    <strong className="text-slate-900 font-bold">MB Bank (Ngân hàng Quân Đội)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                    <strong className="text-blue-600 font-mono text-sm font-bold">0912345678</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Chủ tài khoản:</span>
                    <strong className="text-slate-900 uppercase font-bold">CONG TY TNHH CLOUDSERVICE VN</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nội dung chuyển khoản:</span>
                    <strong className="text-blue-700 font-mono text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {createdOrder?.orderCode}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/my-plans"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
              >
                Quản Lý Dịch Vụ Của Tôi
              </a>
              <a
                href="/"
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Quay Lại Trang Chủ
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center text-sm">Đang tải biểu mẫu đặt hàng...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
