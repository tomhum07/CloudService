"use client";
import React from "react";

export default function AdminDashboard() {
  return (
    <div className="max-w-4xl mx-auto glassmorphism rounded-2xl p-8 border border-white/5 shadow-2xl">
      <div className="mb-8 pb-6 border-b border-white/5">
        <h1 className="text-2xl font-bold">CloudService Admin Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1">Trang quản trị hệ thống bán dịch vụ đám mây</p>
      </div>

      <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Đăng nhập thành công!</h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          Bạn đã kết nối thành công tới Backend. Cơ chế phân quyền JWT đang hoạt động ở chế độ an toàn tối đa với Refresh Token được lưu trữ trong Cookie HttpOnly của trình duyệt.
        </p>
      </div>
    </div>
  );
}
