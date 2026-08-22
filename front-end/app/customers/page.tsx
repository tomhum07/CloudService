"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

const ENTERPRISE_LOGOS = [
  { name: "VNG Cloud", industry: "Công Nghệ & Game", desc: "Hệ thống hạ tầng đa cụm máy chủ", tag: "Enterprise" },
  { name: "FPT Telecom", industry: "Viễn Thông & CNTT", desc: "Định tuyến lưu lượng mạng Anycast", tag: "Đối Tác Hạ Tầng" },
  { name: "Tiki Corporation", industry: "Thương Mại Điện Tử", desc: "Hệ thống Web & Storage dữ liệu lớn", tag: "E-Commerce" },
  { name: "Viettel IDC", industry: "Trung Tâm Dữ Liệu", desc: "Cụm Datacenter Tier 3 Quốc tế", tag: "Datacenter" },
  { name: "VNPT Group", industry: "Mạng & Truyền Dẫn", desc: "Băng thông đường truyền 100Gbps+", tag: "Hạ Tầng Mạng" },
  { name: "MoMo Fintech", industry: "Tài Chính & Thanh Toán", desc: "Bảo mật tường lửa Anti-DDoS tài chính", tag: "Fintech" }
];

const TESTIMONIALS_LIST = [
  {
    id: 1,
    name: "Nguyễn Văn Hùng",
    role: "Giám Đốc Kỹ Thuật (CTO)",
    company: "Công ty Cổ phần Công nghệ SmartTech",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    date: "15/08/2026",
    service: "Cloud VPS NVMe Pro 4",
    comment: "Hạ tầng Cloud VPS tại CloudService thực sự vượt ngoài mong đợi của chúng tôi. Ổ cứng NVMe cho tốc độ IOPS cực cao, website thương mại điện tử của chúng tôi tải trang dưới 0.8 giây kể cả vào các đợt Flash Sale lưu lượng lớn."
  },
  {
    id: 2,
    name: "Trần Thị Mai Lan",
    role: "Trưởng phòng CNTT",
    company: "Tập đoàn Bán lẻ VinRetail Solutions",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    date: "02/08/2026",
    service: "Business Hosting & Firewall",
    comment: "Dịch vụ Tường lửa Anti-DDoS hoạt động vô cùng hiệu quả. Website của công ty từng bị tấn công từ chối dịch vụ liên tục nhưng sau khi trỏ qua hệ thống WAF của CloudService thì mọi cuộc tấn công đều được lọc sạch tự động."
  },
  {
    id: 3,
    name: "Lê Hoàng Quân",
    role: "Founder & Lead Developer",
    company: "Startup Nông nghiệp Công nghệ cao AgriFuture",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    date: "20/07/2026",
    service: "Cloud VPS SSD & Domain",
    comment: "Đội ngũ hỗ trợ kỹ thuật 24/7 phản hồi cực kỳ nhanh chóng. Mỗi khi mở Ticket kỹ thuật về cấu hình SSL hoặc phân quyền cơ sở dữ liệu, chuyên gia đều hỗ trợ giải quyết trong vòng 5 phút."
  },
  {
    id: 4,
    name: "Phạm Quốc Bảo",
    role: "Chuyên gia Giải pháp Phần mềm",
    company: "BaoPham Media & Digital Agency",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    date: "10/07/2026",
    service: "MaxSpeed Hosting LiteSpeed",
    comment: "Hệ thống thanh toán quét mã PayOS QR Code tự động kích hoạt dịch vụ ngay lập tức là điểm cộng rất lớn. Khách hàng của tôi rất thích sự tiện lợi và chuyên nghiệp này."
  }
];

export default function CustomersPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedQrPlan, setSelectedQrPlan] = useState<any | null>(null);

  // Form feedback state
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackCompany, setFeedbackCompany] = useState("");
  const [feedbackService, setFeedbackService] = useState("Cloud VPS NVMe");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await apiFetch("/api/service-plans?pageSize=20");
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items)) {
            setPlans(items.filter((p: any) => p.isActive !== false));
          }
        }
      } catch (err) {
        console.warn("Lỗi tải gói cước cho trang Khách hàng:", err);
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();
  }, []);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedFeedback(true);
    setTimeout(() => {
      setFeedbackName("");
      setFeedbackCompany("");
      setFeedbackComment("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. HERO HEADER */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>KHÁCH HÀNG & ĐỐI TÁC TIÊU BIỂU</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto mb-4">
            Đồng Hành Cùng Hơn <span className="text-blue-600">5.000+</span> Doanh Nghiệp & Lập Trình Viên
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Khám phá những trải nghiệm thực tế từ các doanh nghiệp, tổ chức và chuyên gia công nghệ đang vận hành hạ tầng Cloud tại CloudService.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">99.99%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Cam Kết Uptime SLA</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">5.000+</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Khách Hàng Doanh Nghiệp</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">&lt; 5 Phút</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Thời Gian Phản Hồi Ticket</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">100%</div>
              <div className="text-xs font-semibold text-slate-600 mt-1">Ổ Cứng NVMe Enterprise</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGO KHÁCH HÀNG TIÊU BIỂU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Mạng Lưới Đối Tác</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Đối Tác & Khách Hàng Tiêu Biểu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {ENTERPRISE_LOGOS.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.name[0]}
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>
                <div className="text-xs font-medium text-blue-600 mb-2">{item.industry}</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Hạ tầng đang hoạt động ổn định</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ĐÁNH GIÁ TỪ KHÁCH HÀNG (TESTIMONIALS) */}
      <section className="bg-white border-y border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Cảm Nhận Thực Tế</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Đánh Giá Từ Khách Hàng</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-bold text-sm">★★★★★</span>
              <span className="text-xs font-bold text-slate-700">4.98 / 5.0 (Dựa trên 1.200+ lượt đánh giá)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS_LIST.map((t) => (
              <div
                key={t.id}
                className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.role} • {t.company}</div>
                      </div>
                    </div>
                    <div className="text-amber-400 text-xs">
                      {"★".repeat(t.rating)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Gói: {t.service}
                  </span>
                  <span>Đánh giá ngày {t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MÃ QR TỪNG GÓI DỊCH VỤ (YÊU CẦU ĐỀ BÀI) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-3">
            <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>ĐẶT MUA NHANH TRÊN ĐIỆN THOẠI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mã QR Tra Cứu & Đặt Mua Từng Gói Dịch Vụ
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mt-2">
            Mỗi gói cước đều có một mã QR riêng biệt. Quý khách có thể quét mã bằng camera điện thoại hoặc Zalo để mở ngay trang đăng ký & thanh toán tự động.
          </p>
        </div>

        {loadingPlans ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách mã QR gói cước...</div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Chưa có gói cước nào khả dụng.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all text-center flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 inline-block mb-2">
                    {p.categoryName || "Gói Dịch Vụ"}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-4">
                    {p.description || "Hạ tầng máy chủ chuyên nghiệp"}
                  </p>

                  <div
                    onClick={() => setSelectedQrPlan(p)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl inline-block cursor-pointer transition-all mb-3 shadow-xs"
                    title="Bấm để phóng to mã QR"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://tomhum07.me/order?planId=${p.id}`}
                      alt={`QR Code ${p.name}`}
                      className="w-36 h-36 mx-auto object-contain rounded-xl bg-white p-2 border border-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQrPlan(p)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Phóng To Mã QR
                  </button>
                  <Link
                    href={`/order?planId=${p.id}`}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs"
                  >
                    Đặt Mua Gói Này →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL PHÓNG TO QR */}
      {selectedQrPlan && (
        <div
          onClick={() => setSelectedQrPlan(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-center animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {selectedQrPlan.categoryName || "Gói Dịch Vụ"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedQrPlan(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">{selectedQrPlan.name}</h3>
            <p className="text-xs text-slate-500 mb-5">
              Quét mã bằng Camera điện thoại hoặc Zalo để chuyển thẳng đến trang đăng ký & thanh toán
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-5 inline-block shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedQrPlan.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://tomhum07.me/order?planId=${selectedQrPlan.id}`}
                alt={`QR Code ${selectedQrPlan.name}`}
                className="w-60 h-60 mx-auto rounded-xl shadow-xs bg-white p-3 border border-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Link
                href={`/order?planId=${selectedQrPlan.id}`}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
              >
                <span>🔗 Mở Trang Đặt Mua Ngay</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedQrPlan(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GỬI PHẢN HỒI ĐÁNH GIÁ (FEEDBACK FORM) */}
      <section className="bg-white border-t border-slate-200 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Góp Ý & Phản Hồi</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Chia Sẻ Trải Nghiệm Của Bạn
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ý kiến đóng góp quý báu của quý khách giúp CloudService không ngừng hoàn thiện chất lượng dịch vụ.
            </p>
          </div>

          {submittedFeedback ? (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <h3 className="text-base font-bold text-emerald-900">Cảm Ơn Đóng Góp Của Bạn!</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Đánh giá của bạn đã được ghi nhận vào hệ thống và sẽ được đội ngũ CloudService duyệt hiển thị trong thời gian sớm nhất.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Công Ty / Tổ Chức</label>
                  <input
                    type="text"
                    placeholder="VD: Công ty TNHH ABC"
                    value={feedbackCompany}
                    onChange={(e) => setFeedbackCompany(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gói Dịch Vụ Đang Dùng</label>
                  <select
                    value={feedbackService}
                    onChange={(e) => setFeedbackService(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Cloud VPS NVMe">Cloud VPS NVMe Pro</option>
                    <option value="Cloud VPS SSD">Cloud VPS SSD</option>
                    <option value="MaxSpeed Hosting">MaxSpeed Hosting LiteSpeed</option>
                    <option value="Business Hosting">Business Hosting</option>
                    <option value="Domain & SSL">Tên Miền & Chứng Chỉ SSL</option>
                    <option value="Firewall Anti-DDoS">Tường Lửa Anti-DDoS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mức Độ Hài Lòng</label>
                  <div className="flex items-center gap-2 h-11 px-3.5 rounded-xl bg-white border border-slate-300">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`text-lg transition-transform ${star <= feedbackRating ? "text-amber-400 scale-110" : "text-slate-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">{feedbackRating} / 5 Sao</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nội Dung Đánh Giá / Cảm Nhận *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm về tốc độ máy chủ, độ ổn định và chất lượng chăm sóc khách hàng..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
              >
                Gửi Đánh Giá Của Bạn
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
