"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const router = useRouter();

  // BƯỚC 1: GỬI MÃ OTP QUA RESEND
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!emailOrUsername.trim()) {
      setError("Vui lòng nhập Email hoặc Tên đăng nhập của bạn.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ emailOrUsername: emailOrUsername.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Mã OTP đã được gửi đến email của bạn.");
        setStep(2);
      } else {
        setError(data.message || "Không thể tìm thấy tài khoản hoặc email không hợp lệ.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: XÁC THỰC OTP VÀ ĐẶT LẠI MẬT KHẨU
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("Mã OTP gồm 6 chữ số.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password-otp", {
        method: "POST",
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          otpCode: otpCode.trim(),
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setError(data.message || "Mã OTP không đúng hoặc đã hết hạn.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              CloudService
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Khôi Phục Mật Khẩu</h1>
          <p className="text-xs text-slate-500">
            {step === 1 ? "Nhập thông tin tài khoản để nhận mã OTP qua Email" : "Nhập mã OTP 6 số và mật khẩu mới"}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Email Hoặc Tên Đăng Nhập *</label>
              <input
                type="text"
                required
                placeholder="VD: user@domain.com hoặc nguyen_a"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 mt-2"
            >
              {loading ? "Đang gửi mã OTP..." : "Gửi Mã OTP Xác Thực"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Mã OTP (6 chữ số) *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full h-11 px-4 text-center font-bold tracking-widest text-lg rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Mật Khẩu Mới *</label>
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Xác Nhận Mật Khẩu Mới *</label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 mt-2"
            >
              {loading ? "Đang xử lý..." : "Xác Nhận & Đổi Mật Khẩu"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center block"
            >
              ← Quay lại gửi lại mã
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link href="/login" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            Quay lại trang Đăng Nhập
          </Link>
        </div>

      </div>
    </div>
  );
}
