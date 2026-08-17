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
      setError("Xác nhận mật khẩu mới không trùng khớp.");
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
        setSuccessMsg("Đặt lại mật khẩu thành công! Đang chuyển hướng đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1800);
      } else {
        setError(data.message || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative overflow-hidden py-24">
      {/* Glow background */}
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] top-1/4 left-1/4 pointer-events-none"></div>
      <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] bottom-1/4 right-1/4 pointer-events-none"></div>

      <div className="w-full max-w-md glassmorphism rounded-2xl p-8 border border-white/5 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/20 mx-auto mb-4 hover:scale-105 transition-transform">
              C
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quên Mật Khẩu</h1>
          <p className="text-xs text-gray-400 mt-2">
            {step === 1 ? "Nhập thông tin để nhận mã xác minh OTP qua Email" : "Nhập mã OTP 6 số và thiết lập mật khẩu mới"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* STEP 1: Form Gửi OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-300">
                Email Hoặc Tên Đăng Nhập <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Nhập email đã đăng ký (ví dụ: name@example.com)..."
                className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                "Gửi Mã OTP Xác Minh"
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Form Nhập OTP & Mật khẩu mới */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Mã OTP Xác Thực (6 chữ số) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-center tracking-[8px] text-lg font-bold text-blue-400 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all font-mono"
              />
              <span className="text-[10px] text-slate-500">Mã có hiệu lực trong 5 phút. Hãy kiểm tra hộp thư (cả mục Spam/Junk).</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Mật Khẩu Mới <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Xác Nhận Mật Khẩu Mới <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                ← Gửi Lại
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-semibold flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Xác Nhận Đổi Mật Khẩu"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
          Nhớ mật khẩu?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
