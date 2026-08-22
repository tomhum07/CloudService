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
    <footer className="border-t border-slate-200 bg-white text-slate-700 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        
        {/* Info Col */}
        <div className="sm:col-span-2 flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
              C
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">CloudService</span>
          </Link>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
            Hạ tầng điện toán đám mây thế hệ mới chuẩn Datacenter Tier 3 Quốc tế. Cung cấp Cloud VPS NVMe, Web Hosting tốc độ cao, Tên miền, SSL và Tường lửa chống DDoS đa tầng.
          </p>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">📞 Hotline 24/7:</span>
              <span className="font-bold text-slate-900">1900 6868 - 024 7300 8888</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">✉️ Email hỗ trợ:</span>
              <span>support@cloudservice.vn</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Uptime 99.99%</span>
            <span>•</span>
            <span>Hỗ trợ kỹ thuật 24/7/365</span>
          </div>
        </div>

        {/* Links Col 1: Dịch vụ */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hạ Tầng & Dịch Vụ</h4>
          <Link href="/services/vps-nvme" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Cloud VPS NVMe Pro</Link>
          <Link href="/services/vps-ssd" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Cloud VPS SSD</Link>
          <Link href="/services/maxspeed-hosting" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">MaxSpeed Hosting</Link>
          <Link href="/services/business-hosting" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Business Hosting</Link>
          <Link href="/services/dedicated-server" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Máy chủ vật lý riêng</Link>
        </div>

        {/* Links Col 2: Tên miền & Bảo mật */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tên Miền & An Ninh</h4>
          <Link href="/services/domain-register" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Đăng Ký Tên Miền .VN / .COM</Link>
          <Link href="/services/domain-transfer" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Chuyển Tên Miền</Link>
          <Link href="/services/email-doanh-nghiep" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Email Doanh Nghiệp</Link>
          <Link href="/services/ssl" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Chứng Chỉ Số SSL</Link>
          <Link href="/services/firewall-anti-ddos" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Tường Lửa Anti-DDoS 100Gbps</Link>
        </div>

        {/* Links Col 3: Hỗ trợ & Đối tác */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Về CloudService</h4>
          <Link href="/about" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Về Chúng Tôi</Link>
          <Link href="/pricing" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Bảng Báo Giá Chi Tiết</Link>
          <Link href="/news" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Tin Tức & Khuyến Mãi</Link>
          <Link href="/affiliate" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Đối Tác Tiếp Thị (Affiliate)</Link>
          <Link href="/order" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Khởi Tạo Dịch Vụ →</Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} CloudService. Hệ thống bán dịch vụ Cloud & Datacenter.</p>
        <p>Phát triển bởi nhóm sinh viên tomhum07</p>
      </div>
    </footer>
  );
}
