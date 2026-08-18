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

// Dữ liệu Mega Menu phân loại chuẩn Vietnix
const MEGA_SERVICES = {
  hosting: {
    title: "Hosting",
    badge: "",
    items: [
      {
        slug: "maxspeed-hosting",
        title: "MaxSpeed Hosting",
        desc: "Tốc độ tải vượt trội và hiệu năng tối đa.",
        tag: "Tối ưu PageSpeed",
        speed: 95,
        icon: "🚀",
        highlight: "AMD EPYC | Vietnix Speed Optimizer"
      },
      {
        slug: "business-hosting",
        title: "Business Hosting",
        desc: "CPU mạnh mẽ, backup 2 lần/ngày.",
        tag: "",
        speed: 90,
        icon: "🏢",
        highlight: "AMD EPYC | Vietnix Speed Optimizer"
      },
      {
        slug: "wordpress-hosting",
        title: "WordPress Hosting",
        desc: "Tối ưu WordPress, tăng tốc tải trang.",
        tag: "",
        speed: 90,
        icon: "🌐",
        highlight: "Vietnix Speed Optimizer"
      },
      {
        slug: "nvme-hosting",
        title: "NVMe Hosting",
        desc: "Tải nhanh <1s, ổ cứng NVMe cao cấp.",
        tag: "",
        speed: 85,
        icon: "⚡",
        highlight: "Vietnix Speed Optimizer"
      },
      {
        slug: "seo-hosting",
        title: "SEO Hosting",
        desc: "IP đa dạng, nhiều domain, diệt mã độc tự động.",
        tag: "",
        speed: 80,
        icon: "🔍",
        highlight: "Multi IP Class C"
      }
    ],
    banner: {
      text: "Công nghệ VIETNIX SPEED OPTIMIZER mang đến tốc độ vượt trội",
      cta: "Khám phá →",
      link: "/services/maxspeed-hosting"
    }
  },
  domain: {
    title: "Tên miền",
    badge: "",
    items: [
      {
        slug: "domain-register",
        title: "Đăng Ký Tên Miền",
        desc: "Mua domain cho website để bắt đầu kinh doanh online.",
        tag: "Giá tốt",
        icon: "🌐",
        highlight: "Kích hoạt DNS tức thì"
      },
      {
        slug: "domain-vn",
        title: "Tên Miền .VN",
        desc: "Tên miền Việt Nam uy tín, chuyên nghiệp.",
        tag: "Quốc Gia",
        icon: "🇻🇳",
        highlight: "Bảo hộ thương hiệu VNNIC"
      },
      {
        slug: "pricing?cat=domain",
        title: "Bảng Giá Tên Miền",
        desc: "Kiểm tra giá domain Việt Nam và Quốc Tế nhanh chóng.",
        tag: "",
        icon: "🏷️",
        highlight: "Chỉ từ 249.000đ/năm"
      },
      {
        slug: "domain-transfer",
        title: "Chuyển Tên Miền Về CloudService",
        desc: "Miễn phí chuyển tên miền từ nhà cung cấp khác về.",
        tag: "Tặng 1 năm",
        icon: "🔄",
        highlight: "Giữ nguyên bản ghi DNS"
      }
    ],
    whoisCard: {
      title: "Whois",
      desc: "Tra cứu nhanh thông tin vòng đời tên miền bạn quan tâm",
      cta: "Tra cứu thông tin ngay",
      link: "/#domain-search"
    }
  },
  vps: {
    title: "VPS",
    badge: "",
    items: [
      {
        slug: "vps-nvme",
        title: "Cloud VPS NVMe",
        desc: "Ổ cứng NVMe siêu tốc, CPU AMD EPYC 7003.",
        tag: "Bán chạy",
        speed: 95,
        icon: "⚡",
        highlight: "AMD EPYC | NVMe Gen4"
      },
      {
        slug: "vps-ssd",
        title: "Cloud VPS SSD",
        desc: "Ổ cứng SSD – Cân bằng hiệu năng, chi phí tối ưu.",
        tag: "Tiết kiệm",
        speed: 80,
        icon: "💾",
        highlight: "SSD Enterprise | Dung lượng lớn"
      }
    ]
  },
  cloud: {
    title: "Dịch vụ Cloud",
    badge: "MỚI",
    items: [
      {
        slug: "enterprise-cloud",
        title: "Enterprise Cloud",
        desc: "Hạ tầng đám mây mạnh mẽ cho doanh nghiệp lớn.",
        tag: "SLA 99.99%",
        icon: "☁️",
        highlight: "Multi-Cloud & Auto Scaling"
      },
      {
        slug: "s3-object-storage",
        title: "S3 Object Storage",
        desc: "Giải pháp lưu trữ S3-API, chi phí tối ưu.",
        tag: "Giá cực rẻ",
        icon: "📦",
        highlight: "Tương thích 100% AWS S3"
      }
    ]
  },
  server: {
    title: "Máy chủ",
    badge: "",
    items: [
      {
        slug: "dedicated-server",
        title: "Thuê máy chủ",
        desc: "Cấu hình đa dạng, hạ tầng ổn định, giá tối ưu.",
        tag: "100% Vật lý",
        icon: "🖥️",
        highlight: "Dell PowerEdge / HP Enterprise"
      },
      {
        slug: "colocation",
        title: "Thuê chỗ đặt máy chủ",
        desc: "Datacenter chuẩn Tier 3 – Băng thông quốc tế lớn.",
        tag: "Tier 3",
        icon: "🏢",
        highlight: "Viettel IDC / VNPT / FPT"
      }
    ]
  }
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  
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

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 bg-white border-b border-slate-200 shadow-sm transition-all text-slate-800"
        onMouseLeave={() => setHoveredMenu(null)}
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

          {/* Desktop Mega Navigation (Vietnix style) */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            
            {/* 1. HOSTING MEGA MENU */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredMenu("hosting")}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hoveredMenu === "hosting" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span>Hosting</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${hoveredMenu === "hosting" ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {hoveredMenu === "hosting" && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-[840px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Column 1 & 2: Hosting Items */}
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      {MEGA_SERVICES.hosting.items.slice(0, 4).map((item) => (
                        <Link
                          key={item.slug}
                          href={`/services/${item.slug}`}
                          onClick={() => setHoveredMenu(null)}
                          className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start gap-3"
                        >
                          <span className="text-2xl mt-0.5 group-hover:scale-110 transition-transform">{item.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                              {item.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-slate-500 font-medium">Tốc độ:</span>
                              <div className="w-14 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${item.speed}%` }}></div>
                              </div>
                            </div>
                            <div className="text-[10px] text-blue-600 font-medium mt-1">✓ {item.highlight}</div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Column 3: SEO Hosting & Highlight */}
                    <div className="col-span-1 border-l border-slate-100 pl-6 flex flex-col justify-between">
                      <Link
                        href={`/services/${MEGA_SERVICES.hosting.items[4].slug}`}
                        onClick={() => setHoveredMenu(null)}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group block"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{MEGA_SERVICES.hosting.items[4].icon}</span>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                            {MEGA_SERVICES.hosting.items[4].title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{MEGA_SERVICES.hosting.items[4].desc}</p>
                        <div className="text-[10px] text-blue-600 font-bold">✓ {MEGA_SERVICES.hosting.items[4].highlight}</div>
                      </Link>

                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-xs font-bold text-blue-900 mb-1">⚡ Tối Ưu Tốc Độ Tuyệt Đối</p>
                        <p className="text-[11px] text-slate-600 mb-2">Tăng tốc 500% cho mọi website WordPress.</p>
                        <Link
                          href="/services/maxspeed-hosting"
                          onClick={() => setHoveredMenu(null)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          Khám phá công nghệ →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TÊN MIỀN MEGA MENU */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredMenu("domain")}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hoveredMenu === "domain" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span>Tên miền</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${hoveredMenu === "domain" ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {hoveredMenu === "domain" && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-[780px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      {MEGA_SERVICES.domain.items.map((item) => (
                        <Link
                          key={item.slug}
                          href={item.slug.startsWith("pricing") ? `/${item.slug}` : `/services/${item.slug}`}
                          onClick={() => setHoveredMenu(null)}
                          className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start gap-3"
                        >
                          <span className="text-2xl mt-0.5">{item.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                              {item.tag && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Whois Card (Vietnix style) */}
                    <div className="col-span-1 p-5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-between shadow-lg shadow-blue-500/20">
                      <div>
                        <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Tra cứu</div>
                        <h4 className="text-lg font-black mb-2">Whois Domain</h4>
                        <p className="text-xs text-blue-100 leading-relaxed mb-4">
                          Tra cứu nhanh thông tin vòng đời, chủ sở hữu và DNS của tên miền.
                        </p>
                      </div>
                      <Link
                        href="/#domain-search"
                        onClick={() => setHoveredMenu(null)}
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs text-center transition-colors shadow-md"
                      >
                        🔍 Tra cứu thông tin ngay
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. VPS MEGA MENU */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredMenu("vps")}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hoveredMenu === "vps" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span>VPS</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${hoveredMenu === "vps" ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {hoveredMenu === "vps" && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    {MEGA_SERVICES.vps.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/services/${item.slug}`}
                        onClick={() => setHoveredMenu(null)}
                        className="p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start gap-3"
                      >
                        <span className="text-2xl mt-0.5">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{item.tag}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 mb-2 line-clamp-2">{item.desc}</p>
                          <div className="text-[10px] text-blue-600 font-bold">✓ {item.highlight}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. DỊCH VỤ CLOUD */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredMenu("cloud")}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hoveredMenu === "cloud" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span className="relative">
                  Dịch vụ Cloud
                  <span className="absolute -top-2.5 -right-3 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                    MỚI
                  </span>
                </span>
                <svg className={`w-3.5 h-3.5 transition-transform ${hoveredMenu === "cloud" ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {hoveredMenu === "cloud" && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    {MEGA_SERVICES.cloud.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/services/${item.slug}`}
                        onClick={() => setHoveredMenu(null)}
                        className="p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start gap-3"
                      >
                        <span className="text-2xl mt-0.5">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">{item.tag}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 mb-2 line-clamp-2">{item.desc}</p>
                          <div className="text-[10px] text-blue-600 font-bold">✓ {item.highlight}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. MÁY CHỦ */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setHoveredMenu("server")}
            >
              <button
                type="button"
                className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hoveredMenu === "server" ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                <span>Máy chủ</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${hoveredMenu === "server" ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {hoveredMenu === "server" && (
                <div className="absolute top-[calc(100%-4px)] left-0 w-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    {MEGA_SERVICES.server.items.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/services/${item.slug}`}
                        onClick={() => setHoveredMenu(null)}
                        className="p-4 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex items-start gap-3"
                      >
                        <span className="text-2xl mt-0.5">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{item.tag}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 mb-2 line-clamp-2">{item.desc}</p>
                          <div className="text-[10px] text-blue-600 font-bold">✓ {item.highlight}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. DIRECT LINKS (Email, SSL, Anti-DDoS, Pricing) */}
            <Link
              href="/services/email-doanh-nghiep"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Email Doanh Nghiệp
            </Link>

            <Link
              href="/services/ssl"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              SSL
            </Link>

            <Link
              href="/services/firewall-anti-ddos"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Firewall Anti DDoS
            </Link>

            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Bảng Giá
            </Link>
          </nav>

          {/* Right Action: User Menu / Login Button (Màu xanh biển Vietnix) */}
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
          <div className="lg:hidden bg-white border-t border-slate-200 p-6 space-y-4 shadow-xl">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-bold text-slate-800 hover:text-blue-600"
            >
              Trang Chủ
            </Link>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hosting</span>
              <div className="space-y-2 pl-2">
                <Link href="/services/maxspeed-hosting" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">MaxSpeed Hosting</Link>
                <Link href="/services/business-hosting" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Business Hosting</Link>
                <Link href="/services/wordpress-hosting" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">WordPress Hosting</Link>
                <Link href="/services/nvme-hosting" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">NVMe Hosting</Link>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cloud VPS</span>
              <div className="space-y-2 pl-2">
                <Link href="/services/vps-nvme" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Cloud VPS NVMe</Link>
                <Link href="/services/vps-ssd" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Cloud VPS SSD</Link>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Dịch Vụ Khác</span>
              <div className="space-y-2 pl-2">
                <Link href="/services/domain-register" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Đăng Ký Tên Miền</Link>
                <Link href="/services/email-doanh-nghiep" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Email Doanh Nghiệp</Link>
                <Link href="/services/ssl" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Chứng Chỉ SSL</Link>
                <Link href="/services/firewall-anti-ddos" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Firewall Anti-DDoS</Link>
                <Link href="/pricing" onClick={() => setIsOpen(false)} className="block text-xs font-semibold text-slate-700 hover:text-blue-600">Bảng Báo Giá</Link>
              </div>
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
