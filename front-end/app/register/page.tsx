"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, setAccessToken } from "@/utils/api";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

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
        setSuccess("Đăng ký tài khoản thành công! Đang đăng nhập tự động...");
        
        // Tự động đăng nhập luôn sau khi đăng ký
        try {
          const loginRes = await apiFetch("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ username: trimmedUsername, password })
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            setAccessToken(loginData.accessToken);
            setTimeout(() => {
              if (returnUrl) {
                router.push(returnUrl);
              } else {
                router.push("/");
              }
            }, 800);
            return;
          }
        } catch {}

        setTimeout(() => {
          router.push(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login");
        }, 1200);
      } else {
        const errData = await res.json();
        setError(errData.message || "Đăng ký không thành công. Tên đăng nhập hoặc Email có thể đã tồn tại.");
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tạo Tài Khoản Mới</h1>
        <p className="text-xs text-slate-500 mt-1">Đăng ký để quản lý và sử dụng dịch vụ đám mây chuyên nghiệp</p>
      </div>

      {error && (
        <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <input
            type="text"
            required
            placeholder="Họ và Tên (VD: Nguyễn Văn A)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="text"
            required
            placeholder="Tên Đăng Nhập (Username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="email"
            required
            placeholder="Địa Chỉ Email (VD: user@domain.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="password"
            required
            placeholder="Mật Khẩu (Tối thiểu 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
        >
          {loading ? "Đang tạo tài khoản..." : "Đăng Ký Tài Khoản"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-slate-400 text-xs">Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
