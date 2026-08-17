"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự.");
      setLoading(false);
      return;
    }

    if (trimmedFullName.length < 2) {
      setError("Họ và tên phải có ít nhất 2 ký tự.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Địa chỉ email không đúng định dạng hợp lệ.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          fullName: trimmedFullName,
          email: trimmedEmail,
          roleId: 0 // defaults to Customer on Backend
        })
      });

      if (res.ok) {
        setSuccess("Đăng ký tài khoản khách hàng thành công! Đang chuyển hướng đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const errData = await res.json();
        setError(errData.message || "Đăng ký thất bại. Tên đăng nhập hoặc email đã tồn tại.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 relative overflow-hidden pt-28 pb-12">
      {/* Glow background */}
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] top-1/4 left-1/4 pointer-events-none"></div>
      <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] bottom-1/4 right-1/4 pointer-events-none"></div>

      <div className="w-full max-w-md glassmorphism rounded-2xl p-8 border border-white/5 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-500/20 mx-auto mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-gray-400 mt-2">Đăng ký tài khoản khách hàng mới sử dụng dịch vụ</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Họ và Tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email..."
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Tên Đăng Nhập</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên tài khoản..."
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300">Mật Khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự..."
              minLength={6}
              className="w-full h-11 px-4 rounded-xl bg-gray-900/50 border border-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Đăng Ký Tài Khoản"
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Đã có tài khoản?{" "}
            <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
