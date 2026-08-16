"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-white tracking-tight">CloudService</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cung cấp nền tảng điện toán đám mây thế hệ mới. Đem lại hiệu suất tối đa cho giải pháp phần mềm của doanh nghiệp.
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Dịch Vụ</h4>
          <Link href="/services" className="text-xs text-slate-400 hover:text-white transition-colors">Cloud VPS</Link>
          <Link href="/services" className="text-xs text-slate-400 hover:text-white transition-colors">Cloud Hosting</Link>
          <Link href="/services" className="text-xs text-slate-400 hover:text-white transition-colors">Tên Miền & SSL</Link>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Chương Trình</h4>
          <Link href="/pricing" className="text-xs text-slate-400 hover:text-white transition-colors">Bảng Giá Dịch Vụ</Link>
          <Link href="/affiliate" className="text-xs text-slate-400 hover:text-white transition-colors">Cộng Tác Viên (Affiliate)</Link>
          <Link href="/order" className="text-xs text-slate-400 hover:text-white transition-colors">Đăng Ký Đặt Hàng</Link>
        </div>

        {/* Links Column 3 */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-white">Công Ty</h4>
          <Link href="/about" className="text-xs text-slate-400 hover:text-white transition-colors">Về chúng tôi</Link>
          <Link href="/about" className="text-xs text-slate-400 hover:text-white transition-colors">Cam kết SLA</Link>
          <Link href="/news" className="text-xs text-slate-400 hover:text-white transition-colors font-medium text-blue-400">Tin tức & Sự kiện</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} CloudService. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Phát triển bởi nhóm sinh viên tomhum07</span>
        </div>
      </div>
    </footer>
  );
}
