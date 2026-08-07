"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setAccessToken } from "@/utils/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        router.push("/admin/dashboard");
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
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] top-1/4 left-1/4"></div>
      <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] bottom-1/4 right-1/4"></div>

      <div className="w-full max-w-md glassmorphism rounded-2xl p-8 border border-white/5 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/20 mx-auto mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CloudService Admin</h1>
          <p className="text-xs text-gray-400 mt-2">Đăng nhập vào hệ thống quản trị dịch vụ</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-300">Tên Đăng Nhập</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tài khoản admin..."
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-300">Mật Khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Đăng Nhập Hệ Thống"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
