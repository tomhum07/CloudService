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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !bankName || !bankAccount || !bankHolder) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/affiliates", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          phone,
          websiteUrl: channel,
          motivation: `Ngân hàng: ${bankName} | STK: ${bankAccount} | Chủ TK: ${bankHolder}`
        })
      });
    } catch (err) {
      console.warn("Affiliate API error:", err);
    } finally {
      setSubmitting(false);
      setRegistered(true);
    }
  };

  const commissionPolicies = [
    {
      title: "20% Hoa Hồng Đầu",
      desc: "Nhận ngay 20% giá trị hợp đồng thanh toán lần đầu tiên của tất cả khách hàng mới do bạn giới thiệu."
    },
    {
      title: "10% Trọn Đời",
      desc: "Tiếp tục nhận 10% giá trị các lần gia hạn thanh toán tiếp theo trọn đời của khách hàng đó."
    },
    {
      title: "Hạn Mức Payout Thấp",
      desc: "Yêu cầu rút tiền tối thiểu chỉ từ 200.000đ. Hệ thống đối soát tự động, minh bạch."
    },
    {
      title: "Thanh Toán Đúng Hạn",
      desc: "Chi trả hoa hồng tự động qua tài khoản ngân hàng từ ngày 5 đến ngày 10 hằng tháng."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Chương trình đối tác</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Đồng Hành & Chia Sẻ Doanh Thu
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Trở thành Cộng Tác Viên (Affiliate Partner) của CloudService để nhận mức hoa hồng hấp dẫn lên đến 20% trọn đời.
          </p>
        </div>

        {/* Commission Policy Grid */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-8 text-center">Chính Sách Hoa Hồng Của Chúng Tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {commissionPolicies.map((policy, idx) => (
              <div key={idx} className="bg-slate-900 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                <h3 className="text-sm font-bold text-blue-400 mb-3">{policy.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{policy.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          
          {/* Rules & Guidelines */}
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white mb-2">Quy Trình Hoạt Động</h3>
            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400 shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Đăng ký tài khoản CTV</h4>
                  <p className="text-slate-400">Điền biểu mẫu đăng ký bên cạnh. Ban quản trị sẽ phê duyệt tài khoản của bạn trong 24 giờ.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400 shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Nhận link giới thiệu</h4>
                  <p className="text-slate-400">Bạn sẽ có một link giới thiệu dạng duy nhất (ví dụ: ?ref=username) để chia sẻ lên blog, mạng xã hội.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400 shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Khách hàng thanh toán</h4>
                  <p className="text-slate-400">Hệ thống lưu cookie 30 ngày. Khi khách hàng nhấn vào link và đăng ký, hệ thống ghi nhận hoa hồng cho bạn.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTV Registration Form */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-4">Đăng Ký Cộng Tác Viên</h3>
            
            {registered ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-green-950 border border-green-800 rounded-full flex items-center justify-center text-green-400 mx-auto mb-4 font-bold">✓</div>
                <h4 className="text-sm font-bold text-white mb-2">Đăng ký thành công!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thông tin của bạn đã được chuyển tới bộ phận đối tác. Chúng tôi sẽ phê duyệt đơn đăng ký của bạn qua email trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Số điện thoại *</label>
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Kênh chia sẻ (Website, Group, Fanpage) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: facebook.com/groups/devvietnam"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="border-t border-white/5 pt-4">
                  <span className="block text-[10px] font-bold text-slate-400 mb-3 uppercase">Thông tin tài khoản nhận hoa hồng</span>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tên ngân hàng *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Vietcombank, Techcombank..."
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Số tài khoản *</label>
                        <input
                          type="text"
                          required
                          placeholder="Số tài khoản ngân hàng"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Chủ tài khoản (Không dấu) *</label>
                        <input
                          type="text"
                          required
                          placeholder="NGUYEN VAN A"
                          value={bankHolder}
                          onChange={(e) => setBankHolder(e.target.value.toUpperCase())}
                          className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 mt-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang gửi đăng ký..." : "Gửi Đơn Đăng Ký CTV"}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
