"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setAccessToken, getAccessToken, refreshAccessToken } from "@/utils/api";

export default function AdminDashboard() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      // Nếu chưa có Access Token trong RAM, chạy Silent Refresh để lấy token mới từ Cookie
      if (!getAccessToken()) {
        const success = await refreshAccessToken();
        if (!success) {
          router.push("/admin/login");
          return;
        }
      }
      setChecking(false);
    };

    verifySession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    } finally {
      setAccessToken("");
      router.push("/admin/login");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">
      <div className="max-w-4xl mx-auto glassmorphism rounded-2xl p-8 border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold">CloudService Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">Trang quản trị hệ thống bán dịch vụ đám mây</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
          >
            Đăng Xuất
          </button>
        </div>

        <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Đăng nhập thành công!</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Bạn đã kết nối thành công tới Backend. Cơ chế phân quyền JWT đang hoạt động ở chế độ an toàn tối đa với Refresh Token được lưu trữ trong Cookie HttpOnly của trình duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
