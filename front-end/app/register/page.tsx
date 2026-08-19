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
          roleId: 0
        })
      });

      if (res.ok) {
        setSuccess("Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const errData = await res.json();
        setError(errData.message || "Tên đăng nhập hoặc email đã tồn tại trên hệ thống.");
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
          <h1 className="text-xl font-bold text-slate-900 mb-1">Tạo Tài Khoản Khách Hàng</h1>
          <p className="text-xs text-slate-500">Khởi tạo và quản trị hạ tầng Cloud của bạn dễ dàng</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-6">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            {/* <label className="text-xs font-bold text-slate-700 block mb-1.5">Họ và Tên</label> */}
            <input
              type="text"
              required
              placeholder="Họ và Tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            {/* <label className="text-xs font-bold text-slate-700 block mb-1.5">Tên Đăng Nhập</label> */}
            <input
              type="text"
              required
              placeholder="Tên Đăng Nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            {/* <label className="text-xs font-bold text-slate-700 block mb-1.5">Địa Chỉ Email</label> */}
            <input
              type="email"
              required
              placeholder="Địa Chỉ Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            {/* <label className="text-xs font-bold text-slate-700 block mb-1.5">Mật Khẩu</label> */}
            <input
              type="password"
              required
              placeholder="Mật Khẩu"
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
            {loading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
