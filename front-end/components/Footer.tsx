"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="border-t border-white/5 bg-gray-950/40 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-white tracking-tight">CloudService</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cung cấp nền tảng điện toán đám mây thế hệ mới. Đem lại hiệu suất tối đa cho giải pháp phần mềm của doanh nghiệp.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Dịch Vụ</h4>
          <a href="#services" className="text-xs text-gray-400 hover:text-white transition-colors">Cloud VPS</a>
          <a href="#services" className="text-xs text-gray-400 hover:text-white transition-colors">Cloud Hosting</a>
          <a href="#services" className="text-xs text-gray-400 hover:text-white transition-colors">Tên Miền (Domain)</a>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Hỗ Trợ</h4>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Tài liệu hướng dẫn</a>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Hỗ trợ kỹ thuật 24/7</a>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Liên hệ tư vấn</a>
        </div>

        {/* Links Column 3 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Công Ty</h4>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Về chúng tôi</a>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Chính sách bảo mật</a>
          <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Điều khoản dịch vụ</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} CloudService. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Phát triển bởi nhóm sinh viên tomhum07</span>
        </div>
      </div>
    </footer>
  );
}
