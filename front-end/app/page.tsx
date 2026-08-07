import React from "react";

// Dữ liệu mẫu (Mock Data) khớp với thiết kế CSDL
const services = [
  {
    id: 1,
    title: "Cloud VPS Pro",
    description: "Giải pháp máy chủ ảo hiệu năng cực đỉnh, ổ cứng NVMe siêu tốc, cấu hình CPU và RAM mạnh mẽ riêng biệt.",
    features: ["2 vCPUs Intel Xeon", "4 GB RAM LPDDR4", "80 GB NVMe Storage", "Băng thông 1 Gbps không giới hạn"],
    price: "150.000đ",
    unit: "tháng",
    tag: "Phổ biến nhất"
  },
  {
    id: 2,
    title: "Cloud Hosting NVMe",
    description: "Hosting tốc độ cao tối ưu riêng cho WordPress. Tích hợp sẵn chứng chỉ bảo mật SSL và sao lưu tự động.",
    features: ["Băng thông không giới hạn", "Miễn phí chứng chỉ SSL", "Tốc độ tải trang siêu việt", "Backup dữ liệu hằng ngày"],
    price: "35.000đ",
    unit: "tháng",
    tag: "Giá rẻ nhất"
  },
  {
    id: 3,
    title: "Tên Miền (Domain)",
    description: "Đăng ký tên miền giá rẻ nhất thị trường. Hệ thống quản lý DNS chuyên nghiệp hoàn toàn miễn phí.",
    features: ["DNS trung gian Cloudflare", "Kích hoạt tự động tức thì", "Bảo mật thông tin Whois", "Hỗ trợ kỹ thuật 24/7"],
    price: "99.000đ",
    unit: "năm",
    tag: "Đăng ký nhanh"
  }
];

const features = [
  {
    title: "Ổ cứng NVMe SSD siêu tốc",
    description: "Hệ thống lưu trữ 100% bằng ổ cứng NVMe chuyên dụng doanh nghiệp cho tốc độ đọc ghi nhanh gấp 10 lần ổ SSD thường."
  },
  {
    title: "Đảm bảo Uptime 99.99%",
    description: "Hạ tầng Cloud của chúng tôi được thiết kế dự phòng hoàn toàn phần cứng N+1 cho cam kết Uptime đạt mức tối đa."
  },
  {
    title: "Bảo vệ Anti-DDoS nâng cao",
    description: "Hệ thống tường lửa thông minh tự động phát hiện và ngăn chặn các cuộc tấn công DDoS ở tầng mạng và ứng dụng."
  },
  {
    title: "Đội ngũ Hỗ trợ kỹ thuật 24/7",
    description: "Đội ngũ chuyên viên túc trực liên tục hỗ trợ bạn xử lý mọi vấn đề phát sinh bất kể đêm tối hay ngày lễ."
  }
];

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background glow effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-80 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block mb-6 tracking-wide">
          🚀 Nền tảng Cloud Thế Hệ Mới
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
          Chất Lượng Vượt Trội <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Tốc Độ Vượt Giới Hạn
          </span>
        </h1>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Cung cấp máy chủ đám mây tốc độ cực đại, băng thông không giới hạn và bảo mật tối đa giúp nâng tầm hạ tầng kỹ thuật của doanh nghiệp bạn.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#services" className="w-full sm:w-auto px-8 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5">
            Bắt đầu khám phá
          </a>
          <a href="#services" className="w-full sm:w-auto px-8 h-14 rounded-xl bg-gray-900/60 hover:bg-gray-900 border border-white/10 text-white font-semibold flex items-center justify-center transition-all hover:border-white/20">
            Xem bảng giá dịch vụ
          </a>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Các Gói Dịch Vụ Nổi Bật</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Lựa chọn gói dịch vụ phù hợp nhất để triển khai ứng dụng, website hoặc cơ sở dữ liệu của bạn ngay lập tức.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((svc) => (
            <div key={svc.id} className="glow-card glassmorphism rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
              {/* Card top decorative line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-purple-600 opacity-70"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">{svc.title}</h3>
                  <span className="text-xs px-2.5 py-1 rounded bg-white/5 text-gray-300 font-medium">
                    {svc.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">{svc.description}</p>
                <ul className="flex flex-col gap-3 mb-8">
                  {svc.features.map((feat, index) => (
                    <li key={index} className="flex items-center gap-2.5 text-xs text-gray-300">
                      <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{svc.price}</span>
                  <span className="text-xs text-gray-400">/ {svc.unit}</span>
                </div>
                <a href="#" className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center border border-white/5 transition-all duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:border-transparent">
                  Đăng Ký Dịch Vụ
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 block">Tại sao chọn chúng tôi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
              Hạ Tầng Tối Tân <br />
              Đảm Bảo Hiệu Suất Tối Đa
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Chúng tôi không ngừng đầu tư cải tiến trang thiết bị phần cứng cao cấp và tối ưu cấu hình mạng để mang tới dịch vụ Cloud bền bỉ, mượt mà và an toàn nhất cho người dùng.
            </p>
            <div className="flex gap-6 items-center">
              <div>
                <div className="text-3xl font-black text-white mb-1">100k+</div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Khách hàng tin dùng</div>
              </div>
              <div className="h-10 w-[1px] bg-white/10"></div>
              <div>
                <div className="text-3xl font-black text-white mb-1">99.99%</div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cam kết thời gian Uptime</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feat, index) => (
              <div key={index} className="glassmorphism rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
