"use client";
import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function AffiliatePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculator State
  const [clientCount, setClientCount] = useState(15);
  const [averageSpend, setAverageSpend] = useState(350000);

  const firstMonthCommission = clientCount * averageSpend * 0.2;
  const recurringMonthlyCommission = clientCount * averageSpend * 0.1;
  const estimatedYearlyTotal = firstMonthCommission + recurringMonthlyCommission * 11;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFormError("Vui lòng nhập Họ và Tên hợp lệ (tối thiểu 2 ký tự).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Địa chỉ email không đúng định dạng hợp lệ.");
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(trimmedPhone)) {
      setFormError("Số điện thoại không đúng định dạng (Ví dụ: 0912345678).");
      return;
    }

    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) {
      setFormError("Vui lòng nhập đầy đủ thông tin ngân hàng để nhận hoa hồng.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/affiliates", {
        method: "POST",
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          websiteUrl: channel.trim(),
          motivation: `Ngân hàng: ${bankName.trim()} | STK: ${bankAccount.trim()} | Chủ TK: ${bankHolder.trim()}`
        })
      });

      if (res.ok) {
        setRegistered(true);
      } else {
        const data = await res.json();
        setFormError(data.message || "Gửi đơn thất bại. Vui lòng thử lại.");
      }
    } catch {
      setRegistered(true);
    } finally {
      setSubmitting(false);
    }
  };

  const commissionPolicies = [
    {
      icon: "💰",
      title: "20% Hoa Hồng Đầu",
      desc: "Nhận ngay 20% giá trị hợp đồng thanh toán lần đầu tiên của tất cả khách hàng mới do bạn giới thiệu."
    },
    {
      icon: "🔄",
      title: "10% Trọn Đời",
      desc: "Tiếp tục nhận 10% giá trị các lần gia hạn thanh toán tiếp theo trọn đời của khách hàng đó."
    },
    {
      icon: "⚡",
      title: "Hạn Mức Rút Thấp",
      desc: "Yêu cầu rút tiền tối thiểu chỉ từ 200.000đ. Hệ thống đối soát tự động, minh bạch."
    },
    {
      icon: "📅",
      title: "Thanh Toán Đúng Hạn",
      desc: "Chi trả hoa hồng tự động qua tài khoản ngân hàng từ ngày 5 đến ngày 10 hằng tháng."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Chương trình Đối tác Affiliate</span>
        </div>

        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-3">Chương Trình Đối Tác</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Đồng Hành & Chia Sẻ Doanh Thu
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Trở thành Cộng Tác Viên (Affiliate Partner) của CloudService để nhận mức hoa hồng hấp dẫn lên đến 20% trọn đời.
          </p>
        </div>

        {/* Commission Policy Grid */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Chính Sách Hoa Hồng Của Chúng Tôi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {commissionPolicies.map((policy, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all">
                <span className="text-2xl block mb-2">{policy.icon}</span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{policy.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{policy.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERACTIVE COMMISSION CALCULATOR */}
        <section className="mb-16 bg-white border border-blue-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">Công Cụ Ước Tính</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dự Tính Thu Nhập Thụ Động Của Bạn
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Kéo thanh trượt để xem bạn có thể kiếm được bao nhiêu thu nhập hàng tháng khi giới thiệu khách hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700">Số khách hàng giới thiệu / tháng:</label>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {clientCount} khách hàng
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={clientCount}
                  onChange={(e) => setClientCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700">Giá trị đơn hàng trung bình / tháng:</label>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {new Intl.NumberFormat("vi-VN").format(averageSpend)}đ
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={2000000}
                  step={50000}
                  value={averageSpend}
                  onChange={(e) => setAverageSpend(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>100K (Hosting)</span>
                  <span>500K (VPS Pro)</span>
                  <span>2M (Dedicated)</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Hoa hồng tháng đầu (20%)
                </span>
                <div className="text-2xl font-black text-blue-600">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(firstMonthCommission)}
                </div>
                <p className="text-[10px] text-blue-600/80 mt-1">Thanh toán ngay khi khách kích hoạt</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Hoa hồng duy trì / tháng (10%)
                </span>
                <div className="text-2xl font-black text-emerald-600">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(recurringMonthlyCommission)}
                </div>
                <p className="text-[10px] text-emerald-600/80 mt-1">Thu nhập thụ động trọn đời</p>
              </div>

              <div className="sm:col-span-2 p-5 rounded-2xl bg-slate-900 text-white shadow-md">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Ước tính thu nhập năm đầu</span>
                    <div className="text-3xl font-black text-white mt-0.5">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(estimatedYearlyTotal)}
                    </div>
                  </div>
                  <a
                    href="#register-form"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-colors shadow-md"
                  >
                    Bắt Đầu Ngay →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Info & Form */}
        <div id="register-form" className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-16">
          
          {/* Rules & Guidelines */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span>📋</span> Quy Trình Hoạt Động Của Đối Tác
            </h3>
            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Đăng ký tài khoản CTV</h4>
                  <p className="text-slate-500 leading-relaxed">Điền biểu mẫu đăng ký bên cạnh. Ban quản trị sẽ phê duyệt tài khoản của bạn trong 24 giờ.</p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Nhận mã giới thiệu & Banner</h4>
                  <p className="text-slate-500 leading-relaxed">Bạn sẽ nhận được đường link affiliate độc quyền (ví dụ: ?ref=ten_ban) và tài liệu banner tiếp thị.</p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-0.5">Nhận hoa hồng tự động</h4>
                  <p className="text-slate-500 leading-relaxed">Hoa hồng phát sinh khi khách hàng kích hoạt dịch vụ và được tự động chuyển khoản mỗi tháng.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {registered ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl mb-4 font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Đăng Ký Thành Công!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
                  Cảm ơn bạn đã quan tâm. Ban quản trị sẽ đối soát và gửi kết quả xét duyệt qua email của bạn trong thời gian sớm nhất.
                </p>
                <Link
                  href="/"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-block"
                >
                  🏠 Quay Về Trang Chủ
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Biểu Mẫu Đăng Ký Đối Tác</h3>
                <p className="text-xs text-slate-500 mb-4">Vui lòng điền chính xác thông tin nhận tiền hoa hồng.</p>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    ⚠️ {formError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Địa Chỉ Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@domain.com"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Số Điện Thoại *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kênh Quảng Bá / Website (Nếu có)</label>
                  <input
                    type="text"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    placeholder="VD: Facebook cá nhân, Kênh Youtube, Blog cá nhân..."
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block mb-2">Thông Tin Nhận Hoa Hồng (STK Ngân Hàng)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Tên Ngân Hàng (VD: Vietcombank)"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Số Tài Khoản"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <input
                      type="text"
                      required
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="Tên Chủ Thẻ"
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20 mt-2"
                >
                  {submitting ? "Đang gửi đơn..." : "Gửi Đơn Đăng Ký Đối Tác"}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
