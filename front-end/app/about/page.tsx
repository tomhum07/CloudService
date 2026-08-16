"use client";
import React from "react";
import Link from "next/link";

export default function AboutPage() {
  const datacenterSpecs = [
    {
      location: "Viettel IDC Sóng Thần",
      tier: "Tier III Standard",
      bandwidth: "40 Gbps backbone",
      features: "Hệ thống làm mát chuẩn N+1, máy phát điện dự phòng chạy dầu liên tục 72h."
    },
    {
      location: "VNPT Nam Thăng Long",
      tier: "Tier III Standard",
      bandwidth: "20 Gbps backbone",
      features: "Kiểm soát an ninh sinh trắc học 24/7/365, phòng cháy chữa cháy chuẩn FM200."
    }
  ];

  const slaPolicies = [
    {
      uptime: ">= 99.99%",
      refund: "Tiêu chuẩn vận hành thông thường"
    },
    {
      uptime: "99.90% - 99.98%",
      refund: "Bồi thường 10% phí dịch vụ tháng"
    },
    {
      uptime: "99.00% - 99.89%",
      refund: "Bồi thường 25% phí dịch vụ tháng"
    },
    {
      uptime: "< 99.00%",
      refund: "Bồi thường 100% phí dịch vụ tháng"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Về chúng tôi</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            CloudService & Hành Trình Kiến Tạo
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Chúng tôi kiến tạo các hạ tầng đám mây tin cậy và hiệu năng cao giúp mọi doanh nghiệp số hoạt động mượt mà.
          </p>
        </div>

        {/* Lịch sử */}
        <section className="bg-slate-900 border border-white/5 rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Lịch Sử Phát Triển</h2>
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <p>
              Khởi đầu từ năm 2020 bởi nhóm kỹ sư đam mê công nghệ ảo hóa tại Hà Nội, CloudService bắt đầu với sứ mệnh cung cấp dịch vụ máy chủ ảo chất lượng cao với chi phí hợp lý cho các doanh nghiệp vừa và nhỏ tại Việt Nam.
            </p>
            <p>
              Đến năm 2023, chúng tôi đã mở rộng hạ tầng sang 2 trung tâm dữ liệu tiêu chuẩn quốc tế tại Hà Nội và Bình Dương, cung cấp dịch vụ cho hơn 10.000 khách hàng cá nhân và doanh nghiệp, đạt tỷ lệ Uptime thực tế ghi nhận trên 99.99%.
            </p>
            <p>
              Năm 2026, CloudService tiếp tục tối ưu hóa công nghệ ảo hóa KVM, nâng cấp hoàn toàn hệ thống lưu trữ sang dòng ổ cứng doanh nghiệp NVMe Enterprise thế hệ mới nhất và tự động hóa toàn diện quy trình cấp phát Cloud VPS chỉ trong 30 giây.
            </p>
          </div>
        </section>

        {/* Hạ tầng Trung tâm dữ liệu */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center md:text-left">Hạ Tầng Trung Tâm Dữ Liệu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {datacenterSpecs.map((dc, index) => (
              <div key={index} className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{dc.location}</h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-blue-900/40 text-blue-300 font-medium">
                      {dc.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 font-mono">Băng thông: {dc.bandwidth}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{dc.features}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cam kết SLA */}
        <section className="bg-slate-900 border border-white/5 rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Cam Kết SLA Uptime 99.99%</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            CloudService cam kết chất lượng dịch vụ ở mức cao nhất. Trường hợp hệ thống gặp sự cố ngoài thời gian bảo trì định kỳ, chính sách hoàn phí bồi thường được áp dụng tự động như sau:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Tỷ Lệ Hoạt Động (Uptime)</th>
                  <th className="py-3 px-4 font-semibold">Mức Bồi Thường</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {slaPolicies.map((policy, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono">{policy.uptime}</td>
                    <td className="py-3.5 px-4">{policy.refund}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-6">
          <h3 className="text-xl font-bold text-white mb-4">Sẵn sàng trải nghiệm dịch vụ đám mây thế hệ mới?</h3>
          <Link
            href="/order"
            className="inline-flex items-center justify-center px-8 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Đăng Ký Đặt Hàng Ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
