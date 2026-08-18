"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, refreshAccessToken, apiFetch, setAccessToken } from "@/utils/api";

interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  role: string;
}

// Cấu trúc danh mục Dịch Vụ gom chung vào 1 tab Mega Menu
const SERVICE_CATEGORIES = [
  {
    id: "vps",
    title: "Cloud VPS",
    badge: "Bán chạy",
    icon: "⚡",
    tagline: "Máy chủ ảo đám mây hiệu năng cao KVM, CPU AMD EPYC / Intel Xeon, ổ cứng NVMe Gen4",
    items: [
      {
        slug: "vps-nvme",
        title: "Cloud VPS NVMe Pro",
        desc: "2 vCPUs - 4 GB RAM - 60 GB NVMe - AMD EPYC",
        price: "150.000đ/th",
        highlight: "Tối ưu database & app"
      },
      {
        slug: "vps-nvme",
        title: "Cloud VPS NVMe Enterprise",
        desc: "4 vCPUs - 8 GB RAM - 120 GB NVMe - AMD EPYC",
        price: "320.000đ/th",
        highlight: "Chịu tải lớn"
      },
      {
        slug: "vps-nvme",
        title: "Cloud VPS NVMe Extreme",
        desc: "8 vCPUs - 16 GB RAM - 200 GB NVMe Gen4",
        price: "650.000đ/th",
        highlight: "Cấu hình cực khủng"
      },
      {
        slug: "vps-ssd",
        title: "Cloud VPS SSD Tiết Kiệm",
        desc: "1 vCPU - 2 GB RAM - 40 GB SSD Enterprise",
        price: "90.000đ/th",
        highlight: "Cân bằng chi phí"
      }
    ]
  },
  {
    id: "hosting",
    title: "Web Hosting",
    badge: "Tối ưu WP",
    icon: "🌐",
    tagline: "Lưu trữ web tốc độ cao sử dụng LiteSpeed Web Server, LSCache và bảo mật Imunify360 AI",
    items: [
      {
        slug: "maxspeed-hosting",
        title: "MaxSpeed Hosting NVMe",
        desc: "LiteSpeed Enterprise, tối ưu điểm PageSpeed 95+",
        price: "45.000đ/th",
        highlight: "Tải nhanh < 0.5s"
      },
      {
        slug: "business-hosting",
        title: "Business Hosting Doanh Nghiệp",
        desc: "CPU AMD EPYC riêng biệt, backup 2 lần/ngày",
        price: "120.000đ/th",
        highlight: "Tài nguyên độc lập"
      },
      {
        slug: "wordpress-hosting",
        title: "WordPress Hosting Chuyên Sâu",
        desc: "Tích hợp WP Toolkit, tự động vá lỗi bảo mật",
        price: "39.000đ/th",
        highlight: "1-Click cài đặt WP"
      },
      {
        slug: "seo-hosting",
        title: "SEO Hosting Multi IP",
        desc: "Nhiều dải IP Class C khác nhau xây dựng web vệ tinh",
        price: "150.000đ/th",
        highlight: "Tối ưu hóa SEO"
      }
    ]
  },
  {
    id: "domain",
    title: "Tên Miền (Domain)",
    badge: "VNNIC",
    icon: "🏷️",
    tagline: "Đăng ký tên miền Việt Nam (.vn) & Quốc tế (.com, .net), kích hoạt DNS Anycast tức thì",
    items: [
      {
        slug: "domain-register",
        title: "Đăng Ký Tên Miền Quốc Tế (.com, .net)",
        desc: "Quản lý DNS Anycast toàn cầu, miễn phí Whois Privacy",
        price: "249.000đ/năm",
        highlight: "Kích hoạt tức thì"
      },
      {
        slug: "domain-vn",
        title: "Tên Miền Quốc Gia .VN",
        desc: "Khẳng định thương hiệu, được pháp luật Việt Nam bảo hộ",
        price: "450.000đ/năm",
        highlight: "Ưu tiên SEO VN"
      },
      {
        slug: "domain-transfer",
        title: "Chuyển Tên Miền Về CloudService",
        desc: "Không gián đoạn website, tặng thêm 1 năm duy trì",
        price: "Miễn phí thủ tục",
        highlight: "Giữ nguyên DNS"
      }
    ]
  },
  {
    id: "email",
    title: "Email Doanh Nghiệp",
    badge: "Inbox 99.9%",
    icon: "✉️",
    tagline: "Hệ thống email theo tên miền riêng (@tenmien.vn), bảo mật chống spam và virus kép",
    items: [
      {
        slug: "email-doanh-nghiep",
        title: "Email Doanh Nghiệp Pro",
        desc: "Cấu hình SPF, DKIM, DMARC, tỷ lệ vào Inbox 99.9%",
        price: "99.000đ/th",
        highlight: "Tên miền riêng"
      },
      {
        slug: "email-doanh-nghiep",
        title: "Email Server Riêng (Mail Cluster)",
        desc: "Hạ tầng gửi nhận email độc lập, dedicated IP sạch",
        price: "550.000đ/th",
        highlight: "Gửi nhận số lượng lớn"
      }
    ]
  },
  {
    id: "ssl",
    title: "Chứng Chỉ Số SSL",
    badge: "Bảo hiểm lớn",
    icon: "🔒",
    tagline: "Mã hóa đường truyền dữ liệu an toàn 256-bit chuẩn quốc tế từ Sectigo, GeoTrust",
    items: [
      {
        slug: "ssl",
        title: "Sectigo PositiveSSL (DV)",
        desc: "Xác thực tên miền nhanh chóng, hiển thị ổ khóa xanh an toàn",
        price: "199.000đ/năm",
        highlight: "Kích hoạt trong 5 phút"
      },
      {
        slug: "ssl",
        title: "Sectigo Wildcard SSL (*.domain)",
        desc: "Bảo vệ không giới hạn tất cả các tên miền con subdomain",
        price: "1.450.000đ/năm",
        highlight: "Không giới hạn Subdomain"
      }
    ]
  },
  {
    id: "firewall",
    title: "Firewall Chống DDoS",
    badge: "Độc quyền",
    icon: "🛡️",
    tagline: "Tường lửa lọc sạch tấn công từ chối dịch vụ Layer 3/4/7 thời gian thực với dung lượng 100Gbps+",
    items: [
      {
        slug: "firewall-anti-ddos",
        title: "Tường Lửa Anti-DDoS Đa Tầng",
        desc: "Ngăn chặn SYN/UDP Flood, HTTP Request Flood bằng AI",
        price: "350.000đ/th",
        highlight: "Độ trễ < 2ms"
      },
      {
        slug: "firewall-anti-ddos",
        title: "WAF Bảo Vệ Ứng Dụng Web Layer 7",
        desc: "Chống cào dữ liệu, chống brute-force và spam request",
        price: "650.000đ/th",
        highlight: "AI Smart Filter"
      }
    ]
  }
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("vps");
  
  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Profile edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Change password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUserSession();
  }, [pathname]);

  const checkUserSession = async () => {
    let token = getAccessToken();
    if (!token) {
      const success = await refreshAccessToken();
      if (success) {
        token = getAccessToken();
      }
    }

    if (token) {
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const payload = JSON.parse(window.atob(payloadPart));
          const username = payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload["name"] || "";
          const role = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Customer";
          
          try {
            const res = await apiFetch("/api/auth/profile");
            if (res.ok) {
              const prof = await res.json();
              setUser({
                username: prof.username || username,
                fullName: prof.fullName || username,
                email: prof.email || "",
                role: prof.role || role
              });
              setEditFullName(prof.fullName || "");
              setEditEmail(prof.email || "");
              return;
            }
          } catch {}

          setUser({
            username: username || "User",
            fullName: username || "User",
            email: "",
            role: role
          });
          setEditFullName(username || "");
        }
      } catch (err) {
        console.error("Lỗi đọc thông tin đăng nhập:", err);
      }
    } else {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Lỗi khi gọi API logout:", e);
    } finally {
      setAccessToken("");
      setUser(null);
      setShowProfileMenu(false);
      router.push("/login");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg(null);

    const trimmedFullName = editFullName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedFullName) {
      setEditMsg({ text: "Họ và tên không được để trống.", type: "error" });
      setEditLoading(false);
      return;
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEditMsg({ text: "Email không đúng định dạng.", type: "error" });
        setEditLoading(false);
        return;
      }
    }

    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: trimmedFullName,
          email: trimmedEmail
        })
      });

      if (res.ok) {
        setEditMsg({ text: "Cập nhật thông tin thành công!", type: "success" });
        if (user) {
          setUser({ ...user, fullName: trimmedFullName, email: trimmedEmail });
        }
        setTimeout(() => {
          setShowEditModal(false);
          setEditMsg(null);
        }, 1200);
      } else {
        const data = await res.json();
        setEditMsg({ text: data.message || "Cập nhật thất bại.", type: "error" });
      }
    } catch {
      setEditMsg({ text: "Không thể kết nối đến máy chủ Backend.", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg(null);

    if (!oldPassword) {
      setPwdMsg({ text: "Vui lòng nhập mật khẩu hiện tại.", type: "error" });
      setPwdLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ text: "Mật khẩu mới phải có tối thiểu 6 ký tự.", type: "error" });
      setPwdLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: "Xác nhận mật khẩu mới không khớp.", type: "error" });
      setPwdLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      if (res.ok) {
        setPwdMsg({ text: "Đổi mật khẩu thành công!", type: "success" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdMsg(null);
        }, 1500);
      } else {
        const data = await res.json();
        setPwdMsg({ text: data.message || "Mật khẩu cũ không chính xác.", type: "error" });
      }
    } catch {
      setPwdMsg({ text: "Không thể kết nối đến máy chủ Backend.", type: "error" });
    } finally {
      setPwdLoading(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const selectedCategory = SERVICE_CATEGORIES.find((c) => c.id === activeCategoryTab) || SERVICE_CATEGORIES[0];

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 bg-white border-b border-slate-200 shadow-sm transition-all text-slate-800"
        onMouseLeave={() => setIsServicesOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/30 transition-transform group-hover:scale-105">
              C
            </div>
            <span className="text-xl font-black tracking-tight text-blue-900 group-hover:text-blue-600 transition-colors">
              CloudService
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 h-full">
            
            <Link
              href="/"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              Trang Chủ
            </Link>

            {/* TAB DỊCH VỤ - RÊ CHUỘT HIỆN TẤT CẢ DANH MỤC (VPS, Hosting, Domain, Email, SSL, Firewall) */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setIsServicesOpen(true)}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  isServicesOpen || pathname?.startsWith("/services") ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span>Dịch Vụ</span>
                <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-full ml-0.5">
                  6+
                </span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* MEGA MENU CONTAINER GIAO DIỆN SÁNG - TONE XANH BIỂN */}
              {isServicesOpen && (
                <div className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 w-[920px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-12 gap-6">
                    
                    {/* Cột trái: 6 Danh mục Dịch vụ */}
                    <div className="col-span-4 border-r border-slate-100 pr-4 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                        Danh Mục Dịch Vụ
                      </span>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setActiveCategoryTab(cat.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            activeCategoryTab === cat.id
                              ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm"
                              : "hover:bg-slate-50 text-slate-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-xs">{cat.title}</span>
                          </div>
                          {cat.badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              activeCategoryTab === cat.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              {cat.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Cột phải: Các sản phẩm & cấu hình chi tiết của danh mục đang chọn */}
                    <div className="col-span-8 flex flex-col justify-between pl-2">
                      <div>
                        {/* Category Header */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                          <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                              <span>{selectedCategory.icon}</span>
                              <span>{selectedCategory.title}</span>
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {selectedCategory.tagline}
                            </p>
                          </div>
                          <Link
                            href="/pricing"
                            onClick={() => setIsServicesOpen(false)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                          >
                            Bảng giá →
                          </Link>
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                          {selectedCategory.items.map((item, idx) => (
                            <Link
                              key={idx}
                              href={`/services/${item.slug}`}
                              onClick={() => setIsServicesOpen(false)}
                              className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all group block shadow-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {item.title}
                                </h4>
                                <span className="text-xs font-black text-blue-600">{item.price}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                                {item.desc}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                                <span>✓</span>
                                <span>{item.highlight}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Banner */}
                      <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                        <div className="text-xs">
                          <strong className="block font-bold">🚀 Miễn Phí Chuyển Đổi Dữ Liệu & Hỗ Trợ 24/7</strong>
                          <span className="text-[10px] text-blue-100">Cam kết Uptime 99.99% tại Datacenter chuẩn Tier 3.</span>
                        </div>
                        <Link
                          href="/order"
                          onClick={() => setIsServicesOpen(false)}
                          className="px-4 py-1.5 rounded-lg bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors shadow-sm shrink-0"
                        >
                          Khởi Tạo Ngay
                        </Link>
                      </div>

                    </div>

                  </div>
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/pricing" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              Bảng Giá
            </Link>

            <Link
              href="/news"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/news" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              Tin Tức
            </Link>

            <Link
              href="/about"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                pathname === "/about" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              Giới Thiệu
            </Link>
          </nav>

          {/* Right Action: User Menu / Login Button */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold leading-tight">
                      {user.role}
                    </span>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu User */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
                    </div>

                    {(user.role === "Admin" || user.role === "Editor") && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold transition-colors"
                      >
                        <span>📊</span>
                        <span>Trang Quản Trị Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/my-plans"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>📦</span>
                      <span>Quản lý gói cước của tôi</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>✏️</span>
                      <span>Đổi thông tin cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <span>🔑</span>
                      <span>Đổi mật khẩu</span>
                    </button>

                    <div className="my-1 border-t border-slate-100"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                    >
                      <span>🚪</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                >
                  Đăng nhập
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 p-6 space-y-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-bold text-slate-800 hover:text-blue-600"
            >
              Trang Chủ
            </Link>

            {SERVICE_CATEGORIES.map((cat) => (
              <div key={cat.id} className="border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
                  {cat.icon} {cat.title}
                </span>
                <div className="space-y-2 pl-3">
                  {cat.items.map((it, idx) => (
                    <Link
                      key={idx}
                      href={`/services/${it.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block text-xs font-semibold text-slate-700 hover:text-blue-600"
                    >
                      {it.title} - <span className="text-blue-600">{it.price}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <Link href="/pricing" onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-800 hover:text-blue-600">Bảng Giá</Link>
              <Link href="/news" onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-800 hover:text-blue-600">Tin Tức</Link>
              <Link href="/about" onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-800 hover:text-blue-600">Giới Thiệu</Link>
            </div>
          </div>
        )}
      </header>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Cập Nhật Thông Tin Cá Nhân</h3>
            <p className="text-xs text-slate-500 mb-6">Thay đổi Họ tên và Email liên hệ nhận thông báo đơn hàng.</p>

            {editMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                editMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Địa Chỉ Email *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20"
                >
                  {editLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Đổi Mật Khẩu Tài Khoản</h3>
            <p className="text-xs text-slate-500 mb-6">Mật khẩu mới phải có tối thiểu 6 ký tự.</p>

            {pwdMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                pwdMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mật Khẩu Hiện Tại *</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mật Khẩu Mới *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Xác Nhận Mật Khẩu Mới *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20"
                >
                  {pwdLoading ? "Đang cập nhật..." : "Đổi Mật Khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
