"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, setAccessToken } from "@/utils/api";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        } else if (userRole === "Admin" || userRole === "Editor") {
          router.push("/admin/dashboard");
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
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="text"
            required
            placeholder="Tên đăng nhập (Username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="password"
            required
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Quên mật khẩu?
            </Link>
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
