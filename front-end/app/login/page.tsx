"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, setAccessToken } from "@/utils/api";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: trimmedUsername, password })
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.accessToken;
        setAccessToken(token);

        let userRole = data.role || "Customer";
        if (token) {
          try {
            const payloadPart = token.split(".")[1];
            if (payloadPart) {
              const payload = JSON.parse(window.atob(payloadPart));
              userRole = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || userRole;
            }
          } catch (e) {
            console.error("Lỗi giải mã token:", e);
          }
        }

        if (returnUrl) {
          router.push(returnUrl);
        } else if (userRole === "Admin") {
          router.push("/admin/dashboard");
        } else if (userRole === "Editor") {
          router.push("/admin/news");
        } else {
          router.push("/");
        }
      } else {
        const errData = await res.json();
        setError(errData.message || "Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-xl mx-auto mb-3 shadow-lg shadow-blue-500/20">
          C
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Nhập Tài Khoản</h1>
        <p className="text-xs text-slate-500 mt-1">
          {returnUrl ? "Vui lòng đăng nhập để tiếp tục hoàn tất đơn đặt hàng" : "Chào mừng bạn quay trở lại với hệ thống CloudService"}
        </p>
      </div>

      {error && (
        <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên Đăng Nhập *</label>
          <input
            type="text"
            required
            placeholder="Nhập tên đăng nhập của bạn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700">Mật Khẩu *</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-4 pr-11 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
        >
          {loading ? "Đang xác thực..." : "Đăng Nhập Ngay"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-slate-400 text-xs">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
