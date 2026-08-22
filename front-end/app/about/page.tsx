"use client";
import React from "react";
import Link from "next/link";

export default function AboutPage() {
  const datacenterSpecs = [
    {
      location: "Viettel IDC Sóng Thần / Hòa Lạc",
      tier: "Tier III Standard TIA-942",
      bandwidth: "40 Gbps backbone quốc tế",
      features: "Hệ thống làm mát chuẩn N+1, máy phát điện dự phòng chạy dầu liên tục 72h, hệ thống chữa cháy FM200."
    },
    {
      location: "VNPT Nam Thăng Long / Tân Thuận",
      tier: "Tier III Standard TIA-942",
      bandwidth: "20 Gbps backbone trong nước",
      features: "Kiểm soát an ninh sinh trắc học 6 lớp 24/7/365, đường truyền kết nối trực tiếp VNIX không trễ."
    }
  ];

  const slaPolicies = [
    {
      uptime: ">= 99.99%",
      refund: "Tiêu chuẩn vận hành thông thường",
      badge: "Cam kết chuẩn"
    },
    {
      uptime: "99.90% - 99.98%",
      refund: "Bồi thường 10% phí dịch vụ tháng",
      badge: "Mức 1"
    },
    {
      uptime: "99.00% - 99.89%",
      refund: "Bồi thường 25% phí dịch vụ tháng",
      badge: "Mức 2"
    },
    {
      uptime: "< 99.00%",
      refund: "Bồi thường 100% phí dịch vụ tháng",
      badge: "Mức tối đa"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Về chúng tôi</span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-3">Về Chúng Tôi</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            CloudService & Hạ Tầng Điện Toán Đám Mây
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi tiên phong cung cấp các giải pháp máy chủ đám mây, web hosting NVMe và tường lửa chống DDoS chuyên dụng giúp hàng ngàn doanh nghiệp an tâm tăng trưởng.
          </p>
        </div>

        {/* Lịch sử */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 mb-12 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>🏛️</span> Lịch Sử Phát Triển & Sứ Mệnh
          </h2>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Khởi đầu từ năm 2020 bởi đội ngũ kỹ sư hạ tầng mạng và ảo hóa, <strong>CloudService</strong> mang sứ mệnh giải quyết triệt để bài toán website bị chậm, nghẽn mạng do tấn công DDoS hoặc chi phí phần cứng đắt đỏ của các doanh nghiệp tại Việt Nam.
            </p>
            <p>
              Đến nay, CloudService đã vận hành hàng trăm cụm máy chủ ảo hóa KVM, bảo vệ hơn 10.000 tên miền và website thương mại điện tử với tiêu chuẩn Uptime 99.99% và đội ngũ hỗ trợ kỹ thuật trực chiến 24/7/365.
            </p>
          </div>
        </section>

        {/* Hạ tầng Datacenter */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>🏢</span> Hệ Thống Datacenter Chuẩn Tier 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datacenterSpecs.map((dc, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-bold text-slate-900">{dc.location}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {dc.tier}
                  </span>
                </div>
                <div className="text-xs text-blue-600 font-semibold mb-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Băng thông kết nối: {dc.bandwidth}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {dc.features}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cam kết SLA */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Chính Sách Cam Kết Uptime & Bồi Thường SLA</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Cam kết chất lượng dịch vụ (Service Level Agreement) minh bạch và uy tín tuyệt đối với khách hàng.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Tỷ Lệ Uptime Hàng Tháng</th>
                  <th className="py-3 px-4">Chính Sách Bồi Thường</th>
                  <th className="py-3 px-4">Mức Độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slaPolicies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.uptime}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.refund}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        idx === 0 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {item.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Call to action */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center shadow-lg shadow-blue-500/20">
          <h3 className="text-xl font-bold mb-2">Trải Nghiệm Hạ Tầng Tốc Độ Cao Ngay Hôm Nay</h3>
          <p className="text-xs text-blue-100 max-w-lg mx-auto mb-6">
            Khởi tạo Cloud VPS và Web Hosting chỉ trong 30 giây với bảo hành hoàn tiền trong 30 ngày.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/order"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-sm"
            >
              Đăng Ký Trải Nghiệm Ngay
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white border border-blue-400 font-bold text-xs transition-colors"
            >
              Xem Bảng Giá Gói Cước
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
