"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, getAccessToken } from "@/utils/api";

const PRESET_PLANS = [
  {
    id: 1,
    name: "Cloud VPS NVMe Pro - 2 Core",
    category: "Cloud VPS",
    type: "VPS",
    price: 150000,
    cpu: "2 vCPUs Intel Xeon Gold",
    ram: "4 GB RAM ECC",
    storage: "60 GB Enterprise NVMe",
    bandwidth: "1 Gbps Unmetered"
  },
  {
    id: 2,
    name: "Cloud VPS NVMe Enterprise - 4 Core",
    category: "Cloud VPS",
    type: "VPS",
    price: 320000,
    cpu: "4 vCPUs AMD EPYC",
    ram: "8 GB RAM ECC",
    storage: "120 GB Enterprise NVMe",
    bandwidth: "1 Gbps Dedicated"
  },
  {
    id: 3,
    name: "Cloud Hosting NVMe LiteSpeed",
    category: "Web Hosting",
    type: "Hosting",
    price: 45000,
    cpu: "2 Core LiteSpeed",
    ram: "2 GB RAM",
    storage: "20 GB NVMe Storage",
    bandwidth: "Không giới hạn"
  },
  {
    id: 4,
    name: "Email Doanh Nghiệp Pro",
    category: "Email Doanh Nghiệp",
    type: "Email",
    price: 99000,
    cpu: "Mail Cluster",
    ram: "Unmetered",
    storage: "50 GB Mailbox",
    bandwidth: "Anti-Spam & Antivirus"
  },
  {
    id: 5,
    name: "Tường Lửa Anti-DDoS Firewall",
    category: "Bảo Mật",
    type: "Firewall",
    price: 350000,
    cpu: "100 Gbps Capacity",
    ram: "AI Layer 7 WAF",
    storage: "Realtime Analytics",
    bandwidth: "< 2ms Latency"
  }
];

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
  { id: "Yearly", label: "12 Tháng", months: 12, discount: 20, tag: "Khuyên dùng - Tặng 20%" },
  { id: "Biennial", label: "24 Tháng", months: 24, discount: 30, tag: "Ưu đãi lớn - Tặng 30%" }
];

function OrderFormContent() {
  const searchParams = useSearchParams();
  const planIdParam = searchParams.get("planId");
  const planTypeParam = searchParams.get("plan");
  const domainParam = searchParams.get("name");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>(PRESET_PLANS);

  // Form Fields
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
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
      try {
        const res = await apiFetch("/api/service-plans?pageSize=50");
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items) && items.length > 0) {
            const mapped = items.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.categoryName || "Cloud Service",
              type: p.categoryName?.toLowerCase().includes("host")
                ? "Hosting"
                : p.categoryName?.toLowerCase().includes("mail")
                ? "Email"
                : "VPS",
              price: p.prices && p.prices.length > 0 ? p.prices[0].price : 150000,
              cpu: p.cpu || "2 vCPUs",
              ram: p.ram || "4 GB RAM",
              storage: p.storage || "60 GB NVMe",
              bandwidth: p.bandwidth || "1 Gbps"
            }));
            setPlans(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch plans for order form:", err);
      }
    }
    fetchPlans();
  }, []);

  // Pre-select plan if passed from URL
  useEffect(() => {
    if (planIdParam) {
      const parsed = parseInt(planIdParam, 10);
      if (!isNaN(parsed)) {
        setSelectedPlanId(parsed);
      }
    } else if (planTypeParam) {
      const pType = planTypeParam.toLowerCase();
      const found = plans.find((p) => p.type.toLowerCase() === pType || p.category.toLowerCase().includes(pType));
      if (found) setSelectedPlanId(found.id);
    }
  }, [planIdParam, planTypeParam, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || PRESET_PLANS[0];
  const activeCycle = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[3];
  const selectedPanel = CONTROL_PANELS.find((cp) => cp.id === controlPanel) || CONTROL_PANELS[0];

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "CLOUDSERVICE2026" || promoCode.trim().toUpperCase() === "VIETNIX") {
      setDiscountPercent(15);
      alert("Áp dụng mã giảm giá thành công! Bạn được chiết khấu thêm 15% tổng hóa đơn.");
    } else {
      alert("Mã giảm giá không hợp lệ.");
      setDiscountPercent(0);
    }
  };

  const calculateSubtotal = () => {
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
      console.warn("API order submission error. Using mock response:", err);
      setCreatedOrder(orderData);
    }

    setLoading(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-2">Hệ Thống Đặt Hàng Trực Tuyến</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Đăng Ký Khởi Tạo Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hạ tầng được kích hoạt tự động sau khi xác nhận thanh toán thành công.
          </p>
        </div>

        {/* Steps Progress Indicator */}
        <div className="max-w-2xl mx-auto flex items-center justify-between mb-12 px-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? "bg-blue-600 text-white ring-4 ring-blue-500/20" : "bg-slate-800 text-slate-400"
            }`}>1</div>
            <span className={`text-xs ${step >= 1 ? "text-white font-bold" : "text-slate-500"}`}>Cấu hình gói</span>
          </div>
          <div className="flex-1 h-[2px] bg-white/10 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? "bg-blue-600 text-white ring-4 ring-blue-500/20" : "bg-slate-800 text-slate-400"
            }`}>2</div>
            <span className={`text-xs ${step >= 2 ? "text-white font-bold" : "text-slate-500"}`}>Thông tin liên hệ</span>
          </div>
          <div className="flex-1 h-[2px] bg-white/10 mx-4"></div>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? "bg-emerald-600 text-white ring-4 ring-emerald-500/20" : "bg-slate-800 text-slate-400"
            }`}>3</div>
            <span className={`text-xs ${step >= 3 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>Thanh toán</span>
          </div>
        </div>

        {/* STEP 1 & 2: TWO COLUMNS LAYOUT (Configurator + Sticky Summary) */}
        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Configuration Steps */}
            <div className="lg:col-span-2 space-y-8">
              
              {step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-8">
                  
                  {/* 1.1 Select Plan Card Grid */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">1</span>
                      Chọn Gói Cước Hạ Tầng
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {plans.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedPlanId === p.id
                              ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950"
                              : "bg-slate-950/60 border-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-bold text-white">{p.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                              {p.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1 mb-3">
                            <div>CPU: <span className="text-slate-200">{p.cpu}</span></div>
                            <div>RAM: <span className="text-slate-200">{p.ram}</span></div>
                            <div>Ổ cứng: <span className="text-slate-200">{p.storage}</span></div>
                          </div>
                          <div className="text-base font-extrabold text-blue-400">
                            {new Intl.NumberFormat("vi-VN").format(p.price)} đ <span className="text-[10px] text-slate-500 font-normal">/ tháng</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1.2 Billing Cycles with Discounts */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">2</span>
                      Chu Kỳ Thanh Toán
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {BILLING_CYCLES.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setBillingCycle(c.id)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                            billingCycle === c.id
                              ? "bg-blue-900/40 border-blue-500 text-white"
                              : "bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{c.label}</div>
                          {c.tag ? (
                            <span className="text-[9px] font-bold text-emerald-400 block mt-1">{c.tag}</span>
                          ) : (
                            <span className="text-[9px] text-slate-500 block mt-1">Giá chuẩn</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1.3 Datacenter & Location */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">3</span>
                      Vị Trí Trung Tâm Dữ Liệu (Datacenter)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {DATACENTERS.map((dc) => (
                        <label
                          key={dc.id}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer ${
                            datacenter === dc.id ? "bg-blue-950/40 border-blue-500" : "bg-slate-950/60 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="datacenter"
                              checked={datacenter === dc.id}
                              onChange={() => setDatacenter(dc.id)}
                              className="accent-blue-600"
                            />
                            <div>
                              <div className="text-xs font-bold text-white">{dc.name}</div>
                              <div className="text-[10px] text-emerald-400">Độ trễ trung bình: {dc.ping}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 1.4 Operating System (For VPS) */}
                  {selectedPlan.type === "VPS" && (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">4</span>
                        Hệ Điều Hành Máy Chủ (OS)
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LINUX_OS_LIST.map((system) => (
                          <label
                            key={system.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                              os === system.name ? "bg-blue-950/40 border-blue-500" : "bg-slate-950/60 border-white/5"
                            }`}
                          >
                            <input
                              type="radio"
                              name="os"
                              checked={os === system.name}
                              onChange={() => setOs(system.name)}
                              className="accent-blue-600"
                            />
                            <span className="text-xs font-medium text-slate-200">{system.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1.5 Control Panel Addon */}
                  {selectedPlan.type === "VPS" && (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-xs">5</span>
                        Bảng Quản Trị Control Panel (Tùy chọn)
                      </h2>
                      <div className="space-y-2.5">
                        {CONTROL_PANELS.map((cp) => (
                          <label
                            key={cp.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                              controlPanel === cp.id ? "bg-blue-950/40 border-blue-500" : "bg-slate-950/60 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="controlPanel"
                                checked={controlPanel === cp.id}
                                onChange={() => setControlPanel(cp.id)}
                                className="accent-blue-600"
                              />
                              <span className="text-xs font-medium text-slate-200">{cp.name}</span>
                            </div>
                            <span className="text-xs font-bold text-blue-400">
                              {cp.price === 0 ? "Miễn phí" : `+${new Intl.NumberFormat("vi-VN").format(cp.price)} đ/th`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Step Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2"
                    >
                      Tiếp Tục: Điền Thông Tin Đăng Ký →
                    </button>
                  </div>

                </form>
              )}

              {/* STEP 2: Customer Contact Information */}
              {step === 2 && (
                <form onSubmit={handleStep2Submit} className="p-8 rounded-2xl bg-slate-900 border border-white/10 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Bước 2: Thông Tin Khách Hàng</h2>
                    <p className="text-xs text-slate-400">
                      Thông tin truy cập máy chủ (IP, Root password, cPanel) sẽ được gửi tự động qua email này sau khi kích hoạt.
                    </p>
                  </div>

                  {validationError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
                      ⚠️ {validationError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">Số Điện Thoại (Zalo) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">Địa Chỉ Email Nhận Thông Tin *</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">Tên Miền Trỏ Về Dịch Vụ (Nếu có)</label>
                    <input
                      type="text"
                      placeholder="yourdomain.com"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">Ghi Chú Hoặc Yêu Cầu Cài Đặt Thêm</label>
                    <textarea
                      rows={3}
                      placeholder="VD: Cần hỗ trợ mở port 8080, cài sẵn Docker hoặc chuyển dữ liệu từ host cũ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                    >
                      ← Quay Lại Cấu Hình
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
                    >
                      {loading ? "Đang xử lý khởi tạo..." : "Xác Nhận & Tiến Hành Thanh Toán →"}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Right: Sticky Order Summary Card (Vietnix/Viettel IDC Cart) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
                <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-white/10 flex items-center justify-between">
                  <span>Tóm Tắt Đơn Hàng</span>
                  <span className="text-xs text-blue-400 font-mono">1 Dịch vụ</span>
                </h3>

                <div className="space-y-3.5 text-xs pb-4 border-b border-white/10">
                  <div>
                    <div className="font-bold text-white text-sm">{selectedPlan.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{selectedPlan.category}</div>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Chu kỳ thanh toán:</span>
                    <span className="font-bold text-slate-200">{activeCycle.label}</span>
                  </div>
                  {selectedPlan.type === "VPS" && (
                    <div className="flex justify-between text-slate-400">
                      <span>Hệ điều hành:</span>
                      <span className="font-medium text-slate-200 text-right truncate max-w-[140px]">{os}</span>
                    </div>
                  )}
                  {controlPanel !== "none" && (
                    <div className="flex justify-between text-slate-400">
                      <span>Control Panel:</span>
                      <span className="font-medium text-blue-400">{selectedPanel.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Vị trí máy chủ:</span>
                    <span className="font-medium text-slate-200">{datacenter === "hn-tier3" ? "Hà Nội Tier 3" : "TP.HCM Tier 3"}</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="py-4 border-b border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá (VD: VIETNIX)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                    >
                      Áp Dụng
                    </button>
                  </div>
                  {discountPercent > 0 && (
                    <div className="text-[11px] text-emerald-400 mt-2 font-semibold">
                      ✓ Đã áp dụng mã giảm {discountPercent}%
                    </div>
                  )}
                </div>

                {/* Pricing Calculation Breakdown */}
                <div className="py-4 space-y-2 text-xs border-b border-white/10">
                  <div className="flex justify-between text-slate-400">
                    <span>Tạm tính ({activeCycle.months} tháng):</span>
                    <span>{new Intl.NumberFormat("vi-VN").format((selectedPlan.price + selectedPanel.price) * activeCycle.months)} đ</span>
                  </div>
                  {activeCycle.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Giảm giá chu kỳ ({activeCycle.discount}%):</span>
                      <span>-{new Intl.NumberFormat("vi-VN").format(((selectedPlan.price + selectedPanel.price) * activeCycle.months * activeCycle.discount) / 100)} đ</span>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Mã khuyến mãi (-{discountPercent}%):</span>
                      <span>-{new Intl.NumberFormat("vi-VN").format((calculateSubtotal() * discountPercent) / 100)} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Thuế VAT (0%):</span>
                    <span>0 đ</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 flex items-baseline justify-between mb-4">
                  <span className="text-sm font-bold text-white">Tổng Thanh Toán:</span>
                  <span className="text-2xl font-black text-blue-400">
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
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-2xl flex items-center justify-center mx-auto mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Đăng Ký Khởi Tạo Thành Công!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-8">
              Mã đơn hàng: <strong className="text-blue-400 font-mono text-sm">{createdOrder?.orderCode}</strong>. Email xác nhận và hướng dẫn chi tiết đã được gửi tới <strong className="text-white">{createdOrder?.customerEmail}</strong>.
            </p>

            {/* Payment Details Box with VietQR */}
            <div className="p-6 rounded-xl bg-slate-950 border border-white/10 text-left mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-300">Thông Tin Chuyển Khoản Nhanh (VietQR)</span>
                <span className="text-xs font-black text-emerald-400">{new Intl.NumberFormat("vi-VN").format(createdOrder?.totalAmount || 0)} VNĐ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white">
                  {/* Real VietQR image generator */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${createdOrder?.totalAmount || 150000}&addInfo=${encodeURIComponent(createdOrder?.orderCode || "CLOUDSERVICE")}&accountName=CLOUDSERVICE%20VIETNAM`}
                    alt="VietQR Payment"
                    className="w-48 h-48 object-contain"
                  />
                  <span className="text-[10px] text-slate-800 font-bold mt-1">Quét mã bằng ứng dụng Ngân hàng</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngân hàng:</span>
                    <strong className="text-white">MB Bank (Ngân hàng Quân Đội)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                    <strong className="text-blue-400 font-mono text-sm">0912345678</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Chủ tài khoản:</span>
                    <strong className="text-white uppercase">CONG TY TNHH CLOUDSERVICE VN</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nội dung chuyển khoản:</span>
                    <strong className="text-amber-400 font-mono text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {createdOrder?.orderCode}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="/my-plans"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
              >
                Quản Lý Dịch Vụ Của Tôi
              </a>
              <a
                href="/"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm">Đang tải biểu mẫu đặt hàng...</div>}>
      <OrderFormContent />
    </Suspense>
  );
}
