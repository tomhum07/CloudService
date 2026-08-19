"use client";
import React from "react";
import Link from "next/link";

export default function ServicesPage() {
  const servicesList = [
    {
      id: "vps",
      title: "Cloud VPS NVMe Doanh Nghiệp",
      badge: "Phổ biến nhất",
      icon: "⚡",
      description: "Máy chủ ảo đám mây riêng biệt hiệu năng cao với ổ cứng Enterprise NVMe Gen4, ảo hóa KVM chuẩn quốc tế.",
      details: [
        "100% Ổ cứng Enterprise NVMe RAID 10 tốc độ truy xuất siêu tốc.",
        "Bộ vi xử lý Intel Xeon Gold / AMD EPYC chuyên dụng cho tải nặng.",
        "Toàn quyền quản trị Root/Administrator, cài đặt mọi OS Linux/Windows.",
        "Bảo vệ miễn phí bởi Tường lửa Anti-DDoS 100Gbps đa tầng Layer 3/4/7.",
        "Hỗ trợ Backup Snapshot tự động định kỳ, nâng cấp RAM/CPU 1-Click."
      ],
      link: "/order?plan=vps"
    },
    {
      id: "hosting",
      title: "Web Hosting NVMe LiteSpeed",
      badge: "Tối ưu WordPress",
      icon: "🌐",
      description: "Giải pháp lưu trữ website tối ưu 100% cho WordPress, WooCommerce, Laravel và Node.js với tốc độ load trang < 1s.",
      details: [
        "Web Server LiteSpeed Enterprise kết hợp LSCache tăng tốc x5 lần.",
        "Bảng điều khiển cPanel / DirectAdmin có bản quyền giao diện tiếng Việt.",
        "Tích hợp Imunify360 AI quét mã độc và ngăn chặn tấn công tự động.",
        "Băng thông truyền tải không giới hạn, sao lưu dữ liệu JetBackup hằng ngày."
      ],
      link: "/order?plan=hosting"
    },
    {
      id: "email",
      title: "Email Doanh Nghiệp Theo Tên Miền",
      badge: "Uy tín 99.9%",
      icon: "✉️",
      description: "Hệ thống hòm thư điện tử chuyên nghiệp theo thương hiệu riêng (@tenmien.vn), tỷ lệ vào hộp thư Inbox 99.9%.",
      details: [
        "Cấu hình đầy đủ bản ghi xác thực SPF, DKIM, DMARC chống giả mạo.",
        "Giao diện Webmail hiện đại, đồng bộ mượt mà trên Outlook, Gmail, iPhone.",
        "Hệ thống lọc Spam và mã độc kép bảo vệ thông tin doanh nghiệp.",
        "Không giới hạn số lượng tài khoản con và dung lượng lưu trữ lớn."
      ],
      link: "/order?plan=email"
    },
    {
      id: "domain-ssl",
      title: "Tên Miền & Chứng Chỉ SSL",
      badge: "Bảo mật chuẩn",
      icon: "🔒",
      description: "Đăng ký tên miền Việt Nam (.vn) & Quốc tế (.com, .net) cùng chứng chỉ bảo mật mã hóa đường truyền SSL Sectigo/GeoTrust.",
      details: [
        "Nhà đăng ký tên miền chính thức của VNNIC và ICANN uy tín hàng đầu.",
        "Hệ thống quản lý DNS Anycast toàn cầu phân giải cực nhanh.",
        "Chứng chỉ số SSL bảo mật giao dịch, tăng điểm SEO trên Google.",
        "Bảo mật ẩn thông tin người sở hữu tên miền (Whois Privacy Protection)."
      ],
      link: "/order?plan=domain"
    },
    {
      id: "anti-ddos",
      title: "Tường Lửa Anti-DDoS Firewall",
      badge: "Độc quyền",
      icon: "🛡️",
      description: "Giải pháp tường lửa lọc sạch lưu lượng tấn công mạng thời gian thực, bảo vệ hệ thống trước các đợt DDoS quy mô lớn.",
      details: [
        "Lọc sạch các cuộc tấn công Layer 3/4 (SYN Flood, UDP Flood, ICMP Flood).",
        "Lớp lọc ứng dụng Layer 7 WAF thông minh ngăn chặn HTTP Flood và bot cào.",
        "Dung lượng đường truyền lọc lên tới 100Gbps+ với độ trễ < 2ms.",
        "Báo cáo phân tích lưu lượng trực quan theo thời gian thực (Live Analytics)."
      ],
      link: "/order?plan=firewall"
    },
    {
      id: "dedicated",
      title: "Máy Chủ Vật Lý Riêng (Dedicated Server)",
      badge: "Cấu hình cực khủng",
      icon: "🖥️",
      description: "Thuê máy chủ vật lý riêng biệt đặt tại Datacenter chuẩn Tier 3 Viettel IDC / VNPT với đường truyền mạng băng thông cực lớn.",
      details: [
        "Toàn quyền sở hữu và khai thác 100% tài nguyên phần cứng vật lý.",
        "Đường truyền mạng trong nước 10Gbps, quốc tế ổn định không nghẽn.",
        "Hỗ trợ cắm thêm ổ cứng, nâng cấp RAM và thay thế linh kiện trong 30 phút.",
        "Kèm gói hỗ trợ kỹ thuật Managed Service cao cấp 24/7/365."
      ],
      link: "/order?plan=dedicated"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Dịch Vụ Cốt Lõi Chuẩn Datacenter</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Giải Pháp Hạ Tầng & Bảo Mật Toàn Diện
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Hệ sinh thái hạ tầng đám mây chuyên nghiệp dành cho doanh nghiệp, lập trình viên và các sàn thương mại điện tử.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {servicesList.map((svc) => (
            <div
              key={svc.id}
              id={svc.id}
              className="bg-slate-900 border border-white/10 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/40 transition-all duration-300 group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-3xl">{svc.icon}</span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
                    {svc.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {svc.title}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {svc.description}
                </p>

                <div className="h-[1px] bg-white/10 mb-4"></div>

                <ul className="space-y-2.5 mb-8">
                  {svc.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={svc.link}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-md shadow-blue-900/30"
              >
                Đăng Ký Khởi Tạo Ngay →
              </Link>
            </div>
          ))}
        </div>

        {/* Technical Architecture Strip */}
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Bạn Cần Tư Vấn Thiết Kế Giải Pháp Riêng Biệt?</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-6">
            Đội ngũ kỹ sư giải pháp (Solution Architect) của chúng tôi sẵn sàng hỗ trợ tư vấn mô hình Multi-Cloud, cụm chịu tải cao Load Balancer và Hybrid Cloud.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/order"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              Liên Hệ Kỹ Sư Hệ Thống
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Bảng Báo Giá Chi Tiết
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
