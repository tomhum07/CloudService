"use client";
import React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";

export const SERVICE_DETAILS_DATA: Record<string, {
  category: string;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  speedRating: number;
  highlightChip: string;
  priceStarting: string;
  features: { title: string; desc: string; icon?: string }[];
  plans: {
    id?: number;
    name: string;
    cpu: string;
    ram: string;
    storage: string;
    bandwidth: string;
    price: string;
    popular?: boolean;
  }[];
  faqs: { q: string; a: string }[];
}> = {
  "maxspeed-hosting": {
    category: "Hosting",
    badge: "Tối ưu PageSpeed",
    name: "MaxSpeed Hosting",
    tagline: "Tốc độ tải vượt trội và hiệu năng tối đa cho website",
    description: "Giải pháp hosting cao cấp sử dụng 100% ổ cứng Enterprise NVMe Gen4 kết hợp máy chủ Web Server LiteSpeed Enterprise độc quyền, giúp tối ưu điểm số Google PageSpeed 95+ và tải trang tức thì < 0.5s.",
    speedRating: 5,
    highlightChip: "Vietnix Speed Optimizer & LiteSpeed Enterprise",
    priceStarting: "45.000đ/tháng",
    features: [
      { title: "Ổ cứng Enterprise NVMe", desc: "Tốc độ đọc ghi IOPS vượt trội gấp 10 lần SSD thông thường, xử lý database mượt mà." },
      { title: "LiteSpeed Enterprise & LSCache", desc: "Tăng tốc độ phản hồi website WordPress gấp 5 lần so với Apache / Nginx." },
      { title: "Bảo vệ Imunify360 AI", desc: "Tự động quét và diệt mã độc thời gian thực, ngăn chặn tấn công WAF Layer 7." },
      { title: "JetBackup 2 Lần / Ngày", desc: "Dữ liệu được sao lưu độc lập 2 lần mỗi ngày, hỗ trợ phục hồi 1-Click an toàn." }
    ],
    plans: [
      { name: "MaxSpeed 1", cpu: "1 Core AMD EPYC", ram: "1 GB RAM", storage: "10 GB NVMe", bandwidth: "Không giới hạn", price: "45.000đ" },
      { name: "MaxSpeed 2", cpu: "2 Core AMD EPYC", ram: "2 GB RAM", storage: "25 GB NVMe", bandwidth: "Không giới hạn", price: "95.000đ", popular: true },
      { name: "MaxSpeed 3", cpu: "3 Core AMD EPYC", ram: "4 GB RAM", storage: "50 GB NVMe", bandwidth: "Không giới hạn", price: "185.000đ" },
      { name: "MaxSpeed 4", cpu: "4 Core AMD EPYC", ram: "8 GB RAM", storage: "100 GB NVMe", bandwidth: "Không giới hạn", price: "350.000đ" }
    ],
    faqs: [
      { q: "MaxSpeed Hosting có hỗ trợ chuyển website từ nơi khác về miễn phí không?", a: "Có! Đội ngũ kỹ thuật của chúng tôi sẽ hỗ trợ chuyển toàn bộ mã nguồn và database của bạn hoàn toàn miễn phí mà không gây gián đoạn truy cập." },
      { q: "Tôi có được cấp chứng chỉ SSL miễn phí không?", a: "Tất cả các gói MaxSpeed Hosting đều được tích hợp sẵn chứng chỉ Let's Encrypt SSL miễn phí trọn đời tự động gia hạn." }
    ]
  },
  "business-hosting": {
    category: "Hosting",
    badge: "Doanh nghiệp",
    name: "Business Hosting",
    tagline: "CPU mạnh mẽ, tài nguyên riêng biệt và backup 2 lần/ngày",
    description: "Dành riêng cho các website doanh nghiệp lớn, sàn thương mại điện tử, landing page chạy quảng cáo chịu tải hàng chục ngàn lượt truy cập đồng thời.",
    speedRating: 5,
    highlightChip: "CPU AMD EPYC 7003 & Dedicated Resources",
    priceStarting: "120.000đ/tháng",
    features: [
      { title: "Tài nguyên cấp phát độc lập", desc: "Không lo nghẽn tài nguyên do các website khác trên cùng server." },
      { title: "Tường lửa Anti-DDoS WAF", desc: "Chống spam request và tấn công DDoS bảo đảm website luôn online 99.99%." },
      { title: "Mail Server riêng biệt", desc: "Tỷ lệ gửi email thông báo đơn hàng vào thẳng hộp thư Inbox của khách hàng." },
      { title: "Hỗ trợ Redis Cache & Memcached", desc: "Tối ưu hóa truy vấn cơ sở dữ liệu cho hệ thống WooCommerce/Magento." }
    ],
    plans: [
      { name: "Business Pro 1", cpu: "2 vCPUs", ram: "4 GB RAM", storage: "40 GB NVMe", bandwidth: "Không giới hạn", price: "120.000đ" },
      { name: "Business Pro 2", cpu: "4 vCPUs", ram: "8 GB RAM", storage: "80 GB NVMe", bandwidth: "Không giới hạn", price: "240.000đ", popular: true },
      { name: "Business Pro 3", cpu: "6 vCPUs", ram: "16 GB RAM", storage: "150 GB NVMe", bandwidth: "Không giới hạn", price: "450.000đ" }
    ],
    faqs: [
      { q: "Gói Business Hosting có phù hợp chạy web bán hàng lớn không?", a: "Rất phù hợp! Gói này được tối ưu riêng với cấu hình RAM/CPU lớn để xử lý mượt mà các chiến dịch marketing lưu lượng cao." }
    ]
  },
  "wordpress-hosting": {
    category: "Hosting",
    badge: "WordPress Chuyên Sâu",
    name: "WordPress Hosting",
    tagline: "Tối ưu WordPress, tự động cập nhật và tăng tốc tải trang",
    description: "Được cấu hình và tinh chỉnh đặc thù cho nền tảng WordPress. Tích hợp công cụ quản trị WP-CLI, tự động vá lỗ hổng bảo mật plugin và giao diện.",
    speedRating: 5,
    highlightChip: "Vietnix Speed Optimizer & WP Toolkit",
    priceStarting: "39.000đ/tháng",
    features: [
      { title: "Cài đặt WordPress 1-Click", desc: "Khởi tạo website WordPress mới tinh chỉ trong vòng 30 giây." },
      { title: "Plugin LSCache Độc Quyền", desc: "Tăng tốc điểm số Core Web Vitals của Google giúp lên top SEO nhanh hơn." },
      { title: "Tự động vá lỗi bảo mật", desc: "Phát hiện và ngăn chặn các plugin chứa mã độc hay lỗ hổng zero-day." }
    ],
    plans: [
      { name: "WP Starter", cpu: "1 Core", ram: "1.5 GB RAM", storage: "15 GB NVMe", bandwidth: "Không giới hạn", price: "39.000đ" },
      { name: "WP Growth", cpu: "2 Core", ram: "3 GB RAM", storage: "35 GB NVMe", bandwidth: "Không giới hạn", price: "89.000đ", popular: true },
      { name: "WP Scale", cpu: "4 Core", ram: "6 GB RAM", storage: "70 GB NVMe", bandwidth: "Không giới hạn", price: "179.000đ" }
    ],
    faqs: [
      { q: "Tôi chưa biết gì về kỹ thuật có dùng được không?", a: "Giao diện quản lý hoàn toàn bằng tiếng Việt với các nút bấm tự động rất dễ sử dụng." }
    ]
  },
  "nvme-hosting": {
    category: "Hosting",
    badge: "Giá rẻ chất lượng cao",
    name: "NVMe Hosting",
    tagline: "Tải nhanh < 1s, ổ cứng NVMe cao cấp với chi phí tiết kiệm nhất",
    description: "Lựa chọn hoàn hảo cho sinh viên, cá nhân, blog tin tức hoặc các website vừa và nhỏ cần một hosting tốc độ ổn định với mức giá dễ tiếp cận.",
    speedRating: 4,
    highlightChip: "100% NVMe Storage & cPanel Bản Quyền",
    priceStarting: "25.000đ/tháng",
    features: [
      { title: "Ổ cứng NVMe Tốc Độ Cao", desc: "Trải nghiệm tốc độ mượt mà hơn hẳn so với các loại hosting HDD/SSD truyền thống." },
      { title: "DirectAdmin / cPanel", desc: "Bảng điều khiển trực quan, hỗ trợ cài đặt chứng chỉ SSL chỉ với 1 click." }
    ],
    plans: [
      { name: "NVMe Mini", cpu: "1 Core", ram: "1 GB RAM", storage: "5 GB NVMe", bandwidth: "Không giới hạn", price: "25.000đ" },
      { name: "NVMe Basic", cpu: "1 Core", ram: "2 GB RAM", storage: "12 GB NVMe", bandwidth: "Không giới hạn", price: "49.000đ", popular: true },
      { name: "NVMe Plus", cpu: "2 Core", ram: "3 GB RAM", storage: "25 GB NVMe", bandwidth: "Không giới hạn", price: "85.000đ" }
    ],
    faqs: [
      { q: "Có thể nâng cấp gói sau này không?", a: "Hoàn toàn được! Bạn có thể nâng cấp dung lượng bất kỳ lúc nào mà không làm mất dữ liệu." }
    ]
  },
  "seo-hosting": {
    category: "Hosting",
    badge: "Chuyên SEO",
    name: "SEO Hosting",
    tagline: "IP đa dạng Class C, nhiều domain trên một hosting, tự động diệt mã độc",
    description: "Giải pháp xây dựng mạng lưới website vệ tinh (PBN) hiệu quả nhất với nhiều địa chỉ IP Class C khác nhau giúp tăng thứ hạng từ khóa Google nhanh chóng.",
    speedRating: 4,
    highlightChip: "Multi IP Class C & Diệt Mã Độc Imunify360",
    priceStarting: "150.000đ/tháng",
    features: [
      { title: "Nhiều dải IP Class C", desc: "Mỗi website được gắn một địa chỉ IP riêng biệt tránh bị Google phạt mạng lưới." },
      { title: "Quản lý tập trung 1 Dashboard", desc: "Dễ dàng quản lý hàng chục website và database trên cùng một tài khoản." }
    ],
    plans: [
      { name: "SEO 5 IPs", cpu: "2 Core", ram: "3 GB RAM", storage: "30 GB NVMe", bandwidth: "5 Dedicated IPs", price: "150.000đ" },
      { name: "SEO 10 IPs", cpu: "3 Core", ram: "6 GB RAM", storage: "60 GB NVMe", bandwidth: "10 Dedicated IPs", price: "280.000đ", popular: true },
      { name: "SEO 20 IPs", cpu: "4 Core", ram: "10 GB RAM", storage: "120 GB NVMe", bandwidth: "20 Dedicated IPs", price: "520.000đ" }
    ],
    faqs: []
  },
  "vps-nvme": {
    category: "VPS",
    badge: "Hiệu năng cực đỉnh",
    name: "Cloud VPS NVMe",
    tagline: "Ổ cứng NVMe siêu tốc, CPU AMD EPYC 7003, KVM ảo hóa toàn phần",
    description: "Máy chủ ảo đám mây cấu hình cực mạnh chạy trên nền tảng ảo hóa KVM chuẩn Enterprise. 100% ổ cứng NVMe Enterprise RAID 10 mang lại tốc độ xử lý IOPS cao nhất hiện nay.",
    speedRating: 5,
    highlightChip: "CPU AMD EPYC 7003 & KVM Virtualization",
    priceStarting: "150.000đ/tháng",
    features: [
      { title: "CPU AMD EPYC & Intel Xeon Gold", desc: "Tần số xung nhịp cao chuyên dụng cho các ứng dụng backend, API và database lớn." },
      { title: "Tường lửa Anti-DDoS 100Gbps+", desc: "Bảo vệ miễn phí trước các đợt tấn công từ chối dịch vụ Layer 3/4/7." },
      { title: "Toàn quyền Root Access", desc: "Tự do cài đặt hệ điều hành Linux (Ubuntu, AlmaLinux, Debian) hoặc Windows Server." },
      { title: "Snapshot & Backup Tự Động", desc: "Khởi tạo bản sao lưu snapshot chỉ trong vài giây, an toàn tuyệt đối dữ liệu." }
    ],
    plans: [
      { name: "VPS NVMe 1", cpu: "2 vCPUs", ram: "4 GB RAM ECC", storage: "60 GB NVMe Gen4", bandwidth: "1 Gbps Unmetered", price: "150.000đ" },
      { name: "VPS NVMe 2", cpu: "4 vCPUs", ram: "8 GB RAM ECC", storage: "120 GB NVMe Gen4", bandwidth: "1 Gbps Dedicated", price: "320.000đ", popular: true },
      { name: "VPS NVMe 3", cpu: "6 vCPUs", ram: "16 GB RAM ECC", storage: "200 GB NVMe Gen4", bandwidth: "1 Gbps Dedicated", price: "650.000đ" },
      { name: "VPS NVMe 4", cpu: "8 vCPUs", ram: "32 GB RAM ECC", storage: "350 GB NVMe Gen4", bandwidth: "10 Gbps Port", price: "1.250.000đ" }
    ],
    faqs: [
      { q: "Tôi có thể cài đặt hệ điều hành nào trên VPS NVMe?", a: "Hệ thống hỗ trợ tự động cài đặt Ubuntu 24.04/22.04, AlmaLinux 9, Debian 12, CentOS Stream và Windows Server 2022/2019." }
    ]
  },
  "vps-ssd": {
    category: "VPS",
    badge: "Cân bằng chi phí",
    name: "Cloud VPS SSD",
    tagline: "Ổ cứng SSD Enterprise – Cân bằng hiệu năng và chi phí tối ưu",
    description: "Giải pháp máy chủ ảo dung lượng lớn với chi phí tiết kiệm, phù hợp cho việc lưu trữ file, server game, chạy bot automation hoặc môi trường thử nghiệm phần mềm.",
    speedRating: 4,
    highlightChip: "Dung Lượng Lớn & Chi Phí Tiết Kiệm",
    priceStarting: "90.000đ/tháng",
    features: [
      { title: "Dung lượng SSD lớn", desc: "Thoải mái lưu trữ dữ liệu với mức chi phí trên mỗi GB tối ưu nhất." },
      { title: "Băng thông trong nước 1Gbps", desc: "Tốc độ tải về cực nhanh tại các trung tâm dữ liệu Viettel IDC / VNPT." }
    ],
    plans: [
      { name: "VPS SSD 1", cpu: "1 vCPU", ram: "2 GB RAM", storage: "40 GB SSD", bandwidth: "1 Gbps", price: "90.000đ" },
      { name: "VPS SSD 2", cpu: "2 vCPUs", ram: "4 GB RAM", storage: "80 GB SSD", bandwidth: "1 Gbps", price: "160.000đ", popular: true },
      { name: "VPS SSD 3", cpu: "4 vCPUs", ram: "8 GB RAM", storage: "160 GB SSD", bandwidth: "1 Gbps", price: "310.000đ" }
    ],
    faqs: []
  },
  "domain-register": {
    category: "Tên Miền",
    badge: "Chính thức VNNIC & ICANN",
    name: "Đăng Ký Tên Miền",
    tagline: "Mua domain cho website để bắt đầu kinh doanh online chuyên nghiệp",
    description: "Nhà đăng ký tên miền chính thức uy tín với bảng giá cạnh tranh nhất. Hỗ trợ kích hoạt DNS Anycast tức thì và miễn phí ẩn thông tin Whois Privacy.",
    speedRating: 5,
    highlightChip: "DNS Anycast Toàn Cầu & Quản Lý Miễn Phí",
    priceStarting: "249.000đ/năm",
    features: [
      { title: "Kích hoạt DNS tức thì", desc: "Tên miền được kích hoạt và phân giải địa chỉ IP chỉ sau vài giây." },
      { title: "Khóa an toàn Registry Lock", desc: "Bảo vệ tên miền thương hiệu tránh bị chiếm đoạt hoặc đổi nameserver trái phép." },
      { title: "Ẩn danh Whois Privacy", desc: "Bảo vệ thông tin cá nhân và số điện thoại khỏi bị spam quảng cáo." }
    ],
    plans: [
      { name: "Tên Miền .com", cpu: "ICANN Quốc Tế", ram: "DNS Anycast", storage: "Whois Privacy", bandwidth: "Toàn cầu", price: "249.000đ/năm" },
      { name: "Tên Miền .vn", cpu: "VNNIC Việt Nam", ram: "Bảo hộ pháp lý", storage: "DNS VNPT", bandwidth: "Việt Nam", price: "450.000đ/năm", popular: true },
      { name: "Tên Miền .net", cpu: "ICANN Quốc Tế", ram: "DNS Anycast", storage: "Whois Privacy", bandwidth: "Toàn cầu", price: "289.000đ/năm" }
    ],
    faqs: []
  },
  "domain-vn": {
    category: "Tên Miền",
    badge: "Thương hiệu Quốc Gia",
    name: "Tên Miền Quốc Gia .VN",
    tagline: "Tên miền Việt Nam uy tín, khẳng định vị thế thương hiệu doanh nghiệp",
    description: "Tên miền cấp cao nhất của Việt Nam (.vn, .com.vn) được pháp luật Việt Nam bảo hộ, tăng độ tin cậy và ưu tiên hiển thị trên công cụ tìm kiếm Google Việt Nam.",
    speedRating: 5,
    highlightChip: "Bảo Hộ Pháp Lý VNNIC & Ưu Tiên SEO VN",
    priceStarting: "350.000đ/năm",
    features: [
      { title: "Được pháp luật bảo hộ", desc: "Tránh nguy cơ mất thương hiệu tại thị trường Việt Nam." },
      { title: "Tăng điểm SEO Google", desc: "Tối ưu hóa hiển thị cho người dùng tìm kiếm tại Việt Nam." }
    ],
    plans: [
      { name: "Tên Miền .com.vn", cpu: "VNNIC", ram: "Doanh nghiệp", storage: "Bảo hộ", bandwidth: "Việt Nam", price: "350.000đ/năm" },
      { name: "Tên Miền .vn", cpu: "VNNIC", ram: "Thương hiệu Quốc gia", storage: "Bảo hộ", bandwidth: "Việt Nam", price: "450.000đ/năm", popular: true }
    ],
    faqs: []
  },
  "domain-transfer": {
    category: "Tên Miền",
    badge: "Miễn phí chuyển đổi",
    name: "Chuyển Tên Miền Về CloudService",
    tagline: "Miễn phí chuyển tên miền từ nhà cung cấp khác về CloudService",
    description: "Chuyển quản lý tên miền nhanh chóng, không gián đoạn hoạt động của website hay hệ thống email doanh nghiệp. Tặng thêm 1 năm duy trì miễn phí khi chuyển đổi.",
    speedRating: 5,
    highlightChip: "Tặng Thêm 1 Năm Duy Trì & Hỗ Trợ 24/7",
    priceStarting: "Theo giá gia hạn",
    features: [
      { title: "Không gián đoạn website", desc: "Hệ thống giữ nguyên toàn bộ bản ghi DNS trong quá trình chuyển đổi." }
    ],
    plans: [
      { name: "Chuyển .com", cpu: "Transfer", ram: "Tặng 1 năm", storage: "DNS Giữ nguyên", bandwidth: "Toàn cầu", price: "249.000đ" },
      { name: "Chuyển .vn", cpu: "Transfer", ram: "Thủ tục online", storage: "DNS Giữ nguyên", bandwidth: "Việt Nam", price: "Miễn phí" }
    ],
    faqs: []
  },
  "email-doanh-nghiep": {
    category: "Email",
    badge: "Inbox 99.9%",
    name: "Email Doanh Nghiệp Pro",
    tagline: "Hệ thống email theo tên miền riêng (@tenmien.vn), bảo mật và chuyên nghiệp",
    description: "Giải pháp email doanh nghiệp cao cấp với IP sạch, cấu hình sẵn SPF/DKIM/DMARC đảm bảo tỷ lệ vào Inbox cao nhất. Tích hợp bộ lọc Antispam và diệt virus kép.",
    speedRating: 5,
    highlightChip: "Hạ Tầng Mail Cluster & Tỷ Lệ Inbox 99.9%",
    priceStarting: "99.000đ/tháng",
    features: [
      { title: "Địa chỉ Email theo tên miền", desc: "Tạo sự chuyên nghiệp khi giao dịch với đối tác (VD: ceo@tenmien.vn)." },
      { title: "Bộ lọc Antispam & Antivirus kép", desc: "Ngăn chặn 99.9% thư rác, email lừa đảo phishing và mã độc tống tiền." },
      { title: "Đồng bộ đa thiết bị mượt mà", desc: "Tương thích 100% với Outlook, Gmail App, Apple Mail trên điện thoại và máy tính." }
    ],
    plans: [
      { name: "Mail Starter", cpu: "5 Hòm thư", ram: "10 GB Dung lượng", storage: "Webmail Pro", bandwidth: "Không giới hạn gửi", price: "99.000đ/th" },
      { name: "Mail Business", cpu: "20 Hòm thư", ram: "50 GB Dung lượng", storage: "Webmail Pro", bandwidth: "Không giới hạn gửi", price: "250.000đ/th", popular: true },
      { name: "Mail Enterprise", cpu: "50 Hòm thư", ram: "150 GB Dung lượng", storage: "Mail Cluster Riêng", bandwidth: "Dedicated IP", price: "550.000đ/th" }
    ],
    faqs: []
  },
  "ssl": {
    category: "Bảo Mật",
    badge: "Mã hóa SSL 256-bit",
    name: "Chứng Chỉ Số SSL",
    tagline: "Bảo mật website, mã hóa dữ liệu giao dịch và tăng độ uy tín với khách hàng",
    description: "Cung cấp chứng chỉ số SSL quốc tế từ Sectigo, GeoTrust, DigiCert giúp website hiển thị ổ khóa xanh an toàn, bảo vệ thông tin thanh toán và tăng thứ hạng SEO Google.",
    speedRating: 5,
    highlightChip: "Bảo Hiểm Quốc Tế Lên Đến $1,750,000",
    priceStarting: "199.000đ/năm",
    features: [
      { title: "Mã hóa đường truyền 256-bit", desc: "Ngăn chặn hacker đánh cắp mật khẩu và thông tin thẻ tín dụng của khách hàng." },
      { title: "Hỗ trợ Wildcard SSL", desc: "Bảo vệ không giới hạn tất cả các subdomain (*.tenmien.vn)." }
    ],
    plans: [
      { name: "Sectigo PositiveSSL", cpu: "1 Tên miền", ram: "Xác thực Domain (DV)", storage: "Mã hóa 256-bit", bandwidth: "Bảo hiểm $10,000", price: "199.000đ/năm" },
      { name: "Sectigo Wildcard SSL", cpu: "Không giới hạn Subdomain", ram: "Xác thực Domain (DV)", storage: "Mã hóa 256-bit", bandwidth: "Bảo hiểm $10,000", price: "1.450.000đ/năm", popular: true },
      { name: "GeoTrust BusinessID", cpu: "Doanh nghiệp (OV)", ram: "Hiện tên công ty", storage: "Mã hóa 256-bit", bandwidth: "Bảo hiểm $1,250,000", price: "2.100.000đ/năm" }
    ],
    faqs: []
  },
  "firewall-anti-ddos": {
    category: "Bảo Mật",
    badge: "Độc quyền 100Gbps+",
    name: "Firewall Anti-DDoS Đa Tầng",
    tagline: "Hệ thống tường lửa lọc sạch tấn công mạng Layer 3, 4 & 7 thời gian thực",
    description: "Công nghệ Anti-DDoS độc quyền phân tích và xử lý gói tin thông minh bằng AI, tự động nhận diện và chặn đứng các đợt tấn công SYN Flood, UDP Flood, HTTP Request Flood mà không gây độ trễ truy cập.",
    speedRating: 5,
    highlightChip: "Dung Lượng Lọc 100Gbps+ & Độ Trễ < 2ms",
    priceStarting: "350.000đ/tháng",
    features: [
      { title: "Bảo vệ Layer 3 & 4 (Network)", desc: "Lọc sạch lưu lượng tấn công mạng băng thông lớn lên đến 100Gbps+." },
      { title: "Bảo vệ Layer 7 WAF (Application)", desc: "Chống spam form, cào dữ liệu trái phép (Bot Scraping) và HTTP Request Flood." },
      { title: "Giám sát thời gian thực", desc: "Cung cấp bảng biểu đồ lưu lượng và chi tiết các đợt tấn công bị triệt tiêu." }
    ],
    plans: [
      { name: "Firewall Standard", cpu: "30 Gbps Capacity", ram: "Layer 3/4 Protection", storage: "Phản hồi < 1s", bandwidth: "1 Dedicated IP", price: "350.000đ/th" },
      { name: "Firewall Advanced", cpu: "60 Gbps Capacity", ram: "Layer 3/4/7 AI Filter", storage: "WAF Tự động", bandwidth: "2 Dedicated IPs", price: "650.000đ/th", popular: true },
      { name: "Firewall Enterprise", cpu: "120 Gbps+ Capacity", ram: "Custom Rules WAF", storage: "SOC 24/7 Riêng", bandwidth: "Cluster IPs", price: "1.200.000đ/th" }
    ],
    faqs: []
  },
  "dedicated-server": {
    category: "Máy Chủ",
    badge: "Máy chủ vật lý riêng",
    name: "Thuê Máy Chủ Vật Lý (Dedicated Server)",
    tagline: "100% tài nguyên phần cứng riêng biệt tại Datacenter chuẩn Tier 3",
    description: "Cung cấp máy chủ vật lý cấu hình khủng của Dell PowerEdge / HP Enterprise đặt tại Trung tâm dữ liệu Viettel IDC và VNPT với đường truyền mạng băng thông lớn và ổn định tối đa.",
    speedRating: 5,
    highlightChip: "Dell PowerEdge / HP Enterprise & 10Gbps Uplink",
    priceStarting: "1.850.000đ/tháng",
    features: [
      { title: "100% Phần cứng vật lý riêng", desc: "Không chia sẻ tài nguyên với bất kỳ ai, tối đa hóa sức mạnh xử lý." },
      { title: "Đường truyền mạng 10Gbps", desc: "Băng thông trong nước tốc độ cao không giới hạn lưu lượng truyền tải." },
      { title: "Thay thế linh kiện trong 30 phút", desc: "Cam kết xử lý sự cố phần cứng tức thì bởi kỹ sư thường trực tại Datacenter." }
    ],
    plans: [
      { name: "Server Dell E5-2680", cpu: "2x Intel Xeon E5 (28 Cores)", ram: "64 GB RAM ECC", storage: "2x 480 GB SSD Enterprise", bandwidth: "1 Gbps Port", price: "1.850.000đ/th" },
      { name: "Server Dell Gold 6248", cpu: "2x Intel Xeon Gold (40 Cores)", ram: "128 GB RAM ECC", storage: "2x 960 GB NVMe Enterprise", bandwidth: "10 Gbps Port", price: "3.450.000đ/th", popular: true },
      { name: "Server AMD EPYC 7763", cpu: "64 Cores / 128 Threads", ram: "256 GB RAM ECC", storage: "4x 1.92 TB NVMe RAID 10", bandwidth: "10 Gbps Dedicated", price: "6.900.000đ/th" }
    ],
    faqs: []
  },
  "colocation": {
    category: "Máy Chủ",
    badge: "Chỗ đặt Datacenter Tier 3",
    name: "Thuê Chỗ Đặt Máy Chủ (Colocation)",
    tagline: "Không gian tủ Rack Datacenter tiêu chuẩn Quốc tế TIA-942 Rated 3",
    description: "Cung cấp không gian lắp đặt máy chủ (1U, 2U, 4U hoặc trọn gói Full Rack 42U) tại Datacenter Viettel IDC, VNPT, FPT với nguồn điện dự phòng N+1, điều hòa chính xác và an ninh 24/7.",
    speedRating: 5,
    highlightChip: "Datacenter Tier 3 Quốc Tế & Nguồn Điện N+1",
    priceStarting: "1.200.000đ/tháng",
    features: [
      { title: "Hạ tầng Datacenter Tier 3", desc: "Hệ thống làm mát chính xác, PUE thấp, nguồn điện kép UPS và máy phát dự phòng." },
      { title: "Kiểm soát an ninh 6 lớp", desc: "Camera giám sát, nhận diện vân tay/khuôn mặt và bảo vệ túc trực 24/7." }
    ],
    plans: [
      { name: "Chỗ đặt 1U Rack", cpu: "1U Server Space", ram: "Công suất điện 350W", storage: "1 IP Tĩnh", bandwidth: "1 Gbps Shared", price: "1.200.000đ/th" },
      { name: "Chỗ đặt 2U Rack", cpu: "2U Server Space", ram: "Công suất điện 500W", storage: "2 IPs Tĩnh", bandwidth: "1 Gbps Dedicated", price: "1.700.000đ/th", popular: true },
      { name: "Thuê Trọn Gói Full Rack 42U", cpu: "Full 42U Cabinet", ram: "Công suất điện 4kW - 6kW", storage: "Block 16 IPs", bandwidth: "10 Gbps Uplink", price: "Liên hệ" }
    ],
    faqs: []
  },
  "enterprise-cloud": {
    category: "Dịch Vụ Cloud",
    badge: "Doanh nghiệp lớn",
    name: "Enterprise Cloud Solution",
    tagline: "Hạ tầng đám mây mạnh mẽ, linh hoạt mở rộng cho các tập đoàn và hệ thống lớn",
    description: "Giải pháp kiến trúc Multi-Cloud, Private Cloud và High Availability Cluster với cam kết SLA 99.99%, đáp ứng các tiêu chuẩn khắt khe về bảo mật tài chính ngân hàng và bảo vệ dữ liệu doanh nghiệp.",
    speedRating: 5,
    highlightChip: "Kiến Trúc Multi-Cloud & Cam Kết SLA 99.99%",
    priceStarting: "Liên hệ tư vấn",
    features: [
      { title: "Private Cloud Độc Quyền", desc: "Xây dựng hạ tầng đám mây riêng biệt hoàn toàn theo yêu cầu doanh nghiệp." },
      { title: "Tự động co giãn (Auto Scaling)", desc: "Hệ thống tự động tăng giảm tài nguyên máy chủ theo lưu lượng truy cập thực tế." }
    ],
    plans: [
      { name: "Cloud Cluster Cơ Bản", cpu: "Multi-Node Setup", ram: "Auto-Failover", storage: "Ceph Storage NVMe", bandwidth: "Dedicated VLAN", price: "2.500.000đ/th" },
      { name: "Cloud Enterprise Độc Quyền", cpu: "Kiến trúc riêng biệt", ram: "High Availability 99.99%", storage: "All-Flash Storage", bandwidth: "Hỗ trợ 24/7 Dedicated", price: "Liên hệ", popular: true }
    ],
    faqs: []
  },
  "s3-object-storage": {
    category: "Dịch Vụ Cloud",
    badge: "Chuẩn AWS S3",
    name: "S3 Object Storage",
    tagline: "Giải pháp lưu trữ đối tượng tương thích S3 API, chi phí tối ưu",
    description: "Dịch vụ lưu trữ dữ liệu đám mây không giới hạn dung lượng, tương thích 100% với chuẩn Amazon S3 API. Thích hợp lưu trữ hình ảnh, video, tài liệu sao lưu với tốc độ tải nhanh và chi phí chỉ bằng 1/3 AWS.",
    speedRating: 5,
    highlightChip: "Tương Thích 100% AWS S3 API & Chi Phí Cực Rẻ",
    priceStarting: "150.000đ/tháng",
    features: [
      { title: "Chuẩn giao thức S3 API", desc: "Dễ dàng tích hợp với WordPress, NextCloud, Cyberduck, AWS CLI và các SDK." },
      { title: "Độ bền dữ liệu 99.999999999%", desc: "Cơ chế nhân bản dữ liệu 3 vùng an toàn tuyệt đối trước mọi sự cố phần cứng." }
    ],
    plans: [
      { name: "S3 Storage 250GB", cpu: "S3 API", ram: "Băng thông 500GB", storage: "250 GB Storage", bandwidth: "Độ bền 11 số 9", price: "150.000đ/th" },
      { name: "S3 Storage 1TB", cpu: "S3 API", ram: "Băng thông 2TB", storage: "1.000 GB Storage", bandwidth: "Độ bền 11 số 9", price: "450.000đ/th", popular: true },
      { name: "S3 Storage 5TB", cpu: "S3 API", ram: "Băng thông 10TB", storage: "5.000 GB Storage", bandwidth: "Độ bền 11 số 9", price: "1.800.000đ/th" }
    ],
    faqs: []
  }
};

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const staticData = SERVICE_DETAILS_DATA[slug];

  const [category, setCategory] = useState<any | null>(null);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryAndPlans = async () => {
    try {
      setLoading(true);
      const [catRes, planRes] = await Promise.all([
        apiFetch("/api/service-categories?includeInactive=false"),
        apiFetch("/api/service-plans?pageSize=100&includeInactive=false")
      ]);

      let matchedCat: any = null;
      if (catRes.ok) {
        const catData = await catRes.json();
        const cats = catData.items || catData;
        if (Array.isArray(cats)) {
          matchedCat = cats.find((c: any) => 
            (c.slug && c.slug.toLowerCase() === slug.toLowerCase()) ||
            (c.name && c.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase())
          );
          if (matchedCat) setCategory(matchedCat);
        }
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        const allPlans = planData.items || planData;
        if (Array.isArray(allPlans)) {
          let plansForCat: any[] = [];
          if (matchedCat) {
            plansForCat = allPlans.filter((p: any) => p.categoryId === matchedCat.id && p.isActive !== false);
          }
          if (plansForCat.length === 0) {
            // Match by slug or keyword
            const keyword = slug.replace("-hosting", "").replace("vps-", "").replace("-", " ");
            plansForCat = allPlans.filter((p: any) => 
              p.isActive !== false &&
              ((p.categoryName && p.categoryName.toLowerCase().includes(keyword)) ||
               (p.name && p.name.toLowerCase().includes(keyword)))
            );
          }

          if (plansForCat.length > 0) {
            const formatted = plansForCat.map((p: any, idx: number) => {
              const activePrice = (p.prices && p.prices.length > 0) ? p.prices[0] : null;
              const formattedPrice = activePrice
                ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(activePrice.price)
                : "Liên hệ";
              return {
                id: p.id,
                name: p.name,
                cpu: p.cpu || "Tối ưu hóa",
                ram: p.ram || "Tự động co giãn",
                storage: p.storage || "NVMe Enterprise",
                bandwidth: p.bandwidth || "Không giới hạn",
                price: formattedPrice,
                popular: idx === 1
              };
            });
            setDbPlans(formatted);
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi tải dữ liệu dịch vụ từ CSDL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryAndPlans();

    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "plan" || entity === "category" || entity === "price" || entity === "all") {
        fetchCategoryAndPlans();
      }
    });

    return () => unsubscribe();
  }, [slug]);

  // Combine static rich info or dynamic DB category info
  const effectiveCategory = category ? category.name : (staticData ? staticData.category : "Dịch Vụ Cloud");
  const effectiveName = category ? category.name : (staticData ? staticData.name : slug.replace(/-/g, " ").toUpperCase());
  const effectiveDescription = category?.description || staticData?.description || "Giải pháp hạ tầng điện toán đám mây tốc độ cao, đạt chuẩn quốc tế Datacenter Tier 3 với cam kết SLA 99.99%.";
  const effectiveBadge = staticData?.badge || "Tiêu Chuẩn Tier 3";
  const effectiveTagline = staticData?.tagline || `Dịch vụ ${effectiveName} chất lượng cao, an toàn và tối ưu chi phí`;
  const effectiveHighlightChip = staticData?.highlightChip || "Tự Động Kích Hoạt & Uptime 99.99%";
  const effectiveFeatures = staticData?.features || [
    { title: "Hạ Tầng Datacenter Tier 3", desc: "Máy chủ đặt tại các trung tâm dữ liệu hàng đầu với nguồn điện kép và hệ thống làm mát tối ưu." },
    { title: "Bảo Vệ Anti-DDoS Độc Quyền", desc: "Tường lửa đa tầng tự động ngăn chặn các cuộc tấn công mạng Layer 3, 4 và Layer 7." },
    { title: "Kích Hoạt Tức Thì", desc: "Hệ thống tự động thiết lập và bàn giao thông tin quản trị dịch vụ trong vòng 60 giây." },
    { title: "Hỗ Trợ Kỹ Thuật 24/7", desc: "Đội ngũ kỹ sư túc trực 24/7/365 sẵn sàng giải quyết mọi vấn đề của quý khách hàng." }
  ];

  const effectivePlans = dbPlans.length > 0 ? dbPlans : (staticData?.plans || []);
  const effectivePriceStarting = effectivePlans.length > 0 ? `${effectivePlans[0].price} / tháng` : (staticData?.priceStarting || "Liên hệ");
  const effectiveFaqs = staticData?.faqs || [
    { q: `Dịch vụ ${effectiveName} có được dùng thử miễn phí không?`, a: "Quý khách hàng được hưởng chính sách hoàn tiền 100% trong vòng 30 ngày nếu chất lượng không đáp ứng kỳ vọng." },
    { q: "Tôi có được hỗ trợ chuyển đổi dữ liệu không?", a: "Đội ngũ kỹ thuật của chúng tôi sẽ hỗ trợ di chuyển toàn bộ dữ liệu của bạn hoàn toàn miễn phí và không gây gián đoạn hoạt động." }
  ];

  const servicePayload = {
    category: effectiveCategory,
    badge: effectiveBadge,
    name: effectiveName,
    tagline: effectiveTagline,
    description: effectiveDescription,
    speedRating: staticData?.speedRating || 5,
    highlightChip: effectiveHighlightChip,
    priceStarting: effectivePriceStarting,
    features: effectiveFeatures,
    plans: effectivePlans,
    faqs: effectiveFaqs
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <span className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block mb-3"></span>
          <p className="text-xs text-slate-500 font-medium">Đang tải thông tin gói cước từ cơ sở dữ liệu...</p>
        </div>
      </div>
    );
  }

  return <ServiceDetailView service={servicePayload} slug={slug} />;
}

function ServiceFeatureIcon({ index }: { index: number }) {
  const iconSVGs = [
    <svg key="0" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
    <svg key="1" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
    <svg key="2" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>,
    <svg key="3" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ];
  return iconSVGs[index % iconSVGs.length];
}

function ServiceDetailView({ service, slug }: { service: typeof SERVICE_DETAILS_DATA[string]; slug: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO HEADER (Giao diện sáng, màu chủ đạo Xanh Biển) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50 pt-28 pb-16 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-blue-600">{service.category}</Link>
            <span>/</span>
            <span className="text-blue-600 font-bold">{service.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                <span>{service.badge}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                {service.name}
              </h1>
              <p className="text-base sm:text-lg text-blue-700 font-semibold mb-4">
                {service.tagline}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mb-8">
                {service.description}
              </p>

              {/* Speed Rating Bar & Chip */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mb-8 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Tốc độ:</span>
                  <div className="w-24 h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${(service.speedRating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{service.highlightChip}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#pricing-table"
                  className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20"
                >
                  Bảng Giá Gói Cước
                </a>
                <Link
                  href={`/order?plan=${slug}`}
                  className="px-8 py-3.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-sm transition-all shadow-xs"
                >
                  Đăng Ký Khởi Tạo Ngay →
                </Link>
              </div>
            </div>

            {/* Right Card Summary */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Giá khởi điểm từ</span>
              <div className="text-3xl font-black text-blue-600 mb-4">{service.priceStarting}</div>
              <ul className="space-y-3 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Kích hoạt tự động tức thì
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Miễn phí chuyển dữ liệu
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cam kết hoàn tiền 30 ngày
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Hỗ trợ kỹ thuật 24/7/365
                </li>
              </ul>
              <Link
                href={`/order?plan=${slug}`}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-md shadow-blue-500/20"
              >
                Tiến Hành Đặt Hàng →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FEATURES GRID (Giao diện sáng) */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Đặc Quyền Nổi Bật</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ưu Thế Vượt Trội Của {service.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {service.features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <ServiceFeatureIcon index={i} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PRICING TABLE SECTION */}
      <section id="pricing-table" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Báo Giá Chi Tiết</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Lựa Chọn Gói Cấu Hình Phù Hợp
            </h2>
            <p className="text-xs text-slate-500">Giảm thêm 20% khi đăng ký chu kỳ 12 tháng</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {service.plans.map((p, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border flex flex-col justify-between relative transition-all ${
                  p.popular
                    ? "bg-blue-50/40 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm">
                    Khuyên Dùng
                  </span>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{p.name}</h3>
                  <div className="text-2xl font-black text-blue-600 mb-4">
                    {p.price} <span className="text-xs text-slate-500 font-normal">/ tháng</span>
                  </div>
                  
                  {/* Clean Specs Table */}
                  <div className="py-3 my-4 border-t border-b border-slate-100 space-y-2 text-xs">
                    {p.cpu && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-500 font-medium">Vi xử lý</span>
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">{p.cpu}</span>
                      </div>
                    )}
                    {p.ram && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-500 font-medium">Bộ nhớ</span>
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">{p.ram}</span>
                      </div>
                    )}
                    {p.storage && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-500 font-medium">Ổ cứng</span>
                        <span className="font-semibold text-slate-900 font-mono text-[11px]">{p.storage}</span>
                      </div>
                    )}
                    {p.bandwidth && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-500 font-medium">Băng thông</span>
                        <span className="font-semibold text-slate-900">{p.bandwidth}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-600 pt-0.5">
                      <span className="text-slate-500 font-medium">Tường lửa</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                        <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Anti-DDoS WAF
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={p.id ? `/order?planId=${p.id}` : `/order?plan=${slug}&subplan=${encodeURIComponent(p.name)}`}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                    p.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                      : "bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-slate-200 hover:border-blue-600"
                  }`}
                >
                  Đăng Ký Gói Này →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQS */}
      {service.faqs.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-8">
            Câu Hỏi Thường Gặp
          </h2>
          <div className="space-y-4">
            {service.faqs.map((faq, fIdx) => (
              <div key={fIdx} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. FOOTER CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Bạn Chưa Biết Nên Chọn Gói Nào?</h2>
          <p className="text-xs sm:text-sm text-blue-100 mb-6">
            Đội ngũ kỹ thuật viên của CloudService sẵn sàng hỗ trợ tư vấn cấu hình chính xác cho nhu cầu của bạn 24/7.
          </p>
          <Link
            href="/order"
            className="px-8 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-lg shadow-blue-900/30 inline-block"
          >
            Nhận Tư Vấn Miễn Phí
          </Link>
        </div>
      </section>

    </div>
  );
}
