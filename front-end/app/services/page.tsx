"use client";
import React from "react";
import Link from "next/link";

export default function ServicesPage() {
  const servicesList = [
    {
      title: "Cloud VPS Pro",
      icon: "💻",
      description: "Máy chủ ảo đám mây riêng biệt hiệu năng cao chạy trên ảo hóa KVM chuyên nghiệp.",
      details: [
        "Ổ cứng NVMe SSD chuyên dụng doanh nghiệp tốc độ siêu việt.",
        "Bộ vi xử lý Intel Xeon Gold / AMD EPYC mạnh mẽ ổn định.",
        "Cấp quyền Root tối cao, hỗ trợ cài đặt mọi HĐH Linux, Windows Server.",
        "Tính năng Backup Snapshot tự động định kỳ, khôi phục chỉ với 1 click."
      ],
      link: "/order?plan=vps"
    },
    {
      title: "Cloud Hosting NVMe",
      icon: "🌐",
      description: "Giải pháp lưu trữ tối ưu tuyệt đối cho website WordPress và các ứng dụng PHP/Node.js.",
      details: [
        "Sử dụng LiteSpeed Web Server tăng tốc độ phản hồi gấp 5 lần Apache.",
        "Bảng điều khiển cPanel / DirectAdmin Việt hóa dễ sử dụng.",
        "Tích hợp sẵn Imunify360 quét mã độc và bảo mật thời gian thực.",
        "Băng thông truyền tải không giới hạn, backup dữ liệu tự động hằng ngày."
      ],
      link: "/order?plan=hosting"
    },
    {
      title: "Tên Miền & Chứng Chỉ SSL",
      icon: "🔒",
      description: "Thương hiệu trực tuyến chuyên nghiệp và bảo mật mã hóa SSL chuẩn quốc tế.",
      details: [
        "Đăng ký tên miền Việt Nam (.vn, .com.vn) và quốc tế (.com, .net, .org, .xyz).",
        "Hệ thống quản lý DNS trung gian Cloudflare tốc độ phân giải cực nhanh.",
        "Kích hoạt tự động chứng chỉ bảo mật SSL Let's Encrypt miễn phí trọn đời.",
        "Bảo mật ẩn thông tin đăng ký tên miền (Whois Privacy Protection)."
      ],
      link: "/order?plan=domain"
    },
    {
      title: "Hệ Thống Tường Lửa Firewall Nâng Cao",
      icon: "🛡️",
      description: "Giải pháp tường lửa lọc lưu lượng mạng chống tấn công từ chối dịch vụ (DDoS).",
      details: [
        "Lọc sạch các cuộc tấn công Layer 3/4 (SYN Flood, UDP Flood).",
        "Lớp lọc ứng dụng Layer 7 thông minh giúp ngăn chặn spam requests.",
        "Bản đồ phân tích lưu lượng truy cập trực quan thời gian thực.",
        "Độ trễ thấp, không gây ảnh hưởng tới tốc độ tải trang bình thường."
      ],
      link: "/order?plan=firewall"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Dịch vụ cốt lõi</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Giải Pháp Đám Mây Toàn Diện
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi cung cấp dải dịch vụ đa dạng từ hạ tầng máy chủ ảo đến các công cụ bảo mật tường lửa nâng cao.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {servicesList.map((svc, idx) => (
            <div key={idx} className="bg-slate-900 border border-white/5 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{svc.icon}</span>
                  <h2 className="text-xl font-bold text-white">{svc.title}</h2>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {svc.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {svc.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <Link
                  href="/pricing"
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Xem bảng giá chi tiết →
                </Link>
                <Link
                  href={svc.link}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                >
                  Đăng Ký Đăng Nhập
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* SLA Banner */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-white mb-2">Yêu Cầu Cấu Hình Đặc Biệt?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Nếu doanh nghiệp của bạn có nhu cầu thiết kế hạ tầng Private Cloud hoặc cụm máy chủ chịu tải lớn riêng biệt, hãy liên hệ với bộ phận kỹ thuật để được khảo sát và tư vấn chi tiết.
          </p>
          <a
            href="mailto:support@cloudservice.vn"
            className="inline-flex items-center justify-center px-6 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs text-white font-semibold transition-colors"
          >
            Liên Hệ Tư Vấn Thiết Kế
          </a>
        </div>

      </div>
    </div>
  );
}
