"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, setAccessToken } from "@/utils/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

        if (userRole === "Admin" || userRole === "Editor") {
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-slate-500">Truy cập cổng quản lý dịch vụ đám mây của bạn</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên Đăng Nhập *</label>
            <input
              type="text"
              required
              placeholder="VD: admin, customer01"
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
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 mt-2"
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập Ngay"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700">
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
