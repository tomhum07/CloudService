"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, refreshAccessToken, apiFetch, setAccessToken } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  role: string;
}

// Helper render SVG icon chuẩn Enterprise cho từng danh mục
function CategoryIcon({ name = "", className = "w-4 h-4" }: { name?: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("vps") || lower.includes("máy chủ")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    );
  }
  if (lower.includes("host") || lower.includes("web")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    );
  }
  if (lower.includes("domain") || lower.includes("miền")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    );
  }
  if (lower.includes("mail") || lower.includes("thư")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (lower.includes("ssl") || lower.includes("chứng chỉ")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  if (lower.includes("firewall") || lower.includes("ddos") || lower.includes("bảo mật")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<number | string>("");
  
  // Dữ liệu Danh Mục & Gói Cước thật từ Cơ Sở Dữ Liệu
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]);

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
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUserSession();
    fetchRealServicesData();

    // Lắng nghe SignalR để tự động cập nhật Header Menu tức thì khi Admin thêm/sửa/xóa danh mục hoặc gói cước
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "category" || entity === "plan" || entity === "price" || entity === "all") {
        fetchRealServicesData();
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  const fetchRealServicesData = async () => {
    try {
      const [catRes, planRes] = await Promise.all([
        apiFetch("/api/service-categories?pageSize=50"),
        apiFetch("/api/service-plans?pageSize=100")
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const rawCats = catData.items || catData;
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const activeCats = rawCats.filter((c: any) => c.isActive !== false);
          setDbCategories(activeCats);
          if (activeCats.length > 0) {
            setActiveCategoryTab((prev) => prev || activeCats[0].id);
          }
        }
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        const rawPlans = planData.items || planData;
        if (Array.isArray(rawPlans)) {
          setDbPlans(rawPlans.filter((p: any) => p.isActive !== false));
        }
      }
    } catch (err) {
      console.warn("Lỗi khi tải dữ liệu thực tế cho menu dịch vụ:", err);
    }
  };

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

  const currentCategory = dbCategories.find((c) => c.id === activeCategoryTab) || dbCategories[0] || null;
  const currentCategoryPlans = currentCategory
    ? dbPlans.filter((p) => p.categoryId === currentCategory.id)
    : [];

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

            {/* TAB DỊCH VỤ - DỮ LIỆU THẬT TỪ CƠ SỞ DỮ LIỆU */}
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
                {dbCategories.length > 0 && (
                  <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-full ml-0.5">
                    {dbCategories.length}
                  </span>
                )}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* MEGA MENU CONTAINER GIAO DIỆN SÁNG - TONE XANH BIỂN */}
              {isServicesOpen && (
                <div className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 w-[920px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-12 gap-6">
                    
                    {/* Cột trái: Danh mục Dịch vụ thực tế từ DB */}
                    <div className="col-span-4 border-r border-slate-100 pr-4 space-y-1.5 max-h-[380px] overflow-y-auto">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                        Danh Mục Dịch Vụ
                      </span>
                      {dbCategories.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">Đang tải danh mục...</div>
                      ) : (
                        dbCategories.map((cat) => {
                          const isSelected = activeCategoryTab === cat.id || (!activeCategoryTab && dbCategories[0]?.id === cat.id);
                          return (
                            <div
                              key={cat.id}
                              onMouseEnter={() => setActiveCategoryTab(cat.id)}
                              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs"
                                  : "hover:bg-slate-50 text-slate-700 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}>
                                  <CategoryIcon name={cat.name} className="w-4 h-4" />
                                </div>
                                <span className="text-xs truncate">{cat.name}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                {dbPlans.filter((p) => p.categoryId === cat.id).length} gói
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Cột phải: Các gói cước & cấu hình chi tiết thực tế của danh mục đang chọn */}
                    <div className="col-span-8 flex flex-col justify-between pl-2">
                      <div>
                        {currentCategory ? (
                          <>
                            {/* Category Header */}
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <CategoryIcon name={currentCategory.name} className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900">
                                    {currentCategory.name}
                                  </h3>
                                  <p className="text-[11px] text-slate-500 line-clamp-1">
                                    {currentCategory.description || "Hệ thống dịch vụ đám mây hiệu năng cao tiêu chuẩn quốc tế"}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href="/pricing"
                                onClick={() => setIsServicesOpen(false)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                              >
                                Xem Bảng giá →
                              </Link>
                            </div>

                            {/* Items Grid */}
                            <div className="grid grid-cols-2 gap-3.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                              {currentCategoryPlans.length === 0 ? (
                                <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                                  Chưa có gói cước nào trong danh mục này.
                                </div>
                              ) : (
                                currentCategoryPlans.map((plan: any) => {
                                  const prices = plan.prices || [];
                                  const firstPrice = prices[0]?.price || 0;
                                  const formattedPrice = firstPrice > 0
                                    ? new Intl.NumberFormat("vi-VN").format(firstPrice) + "đ/th"
                                    : "Liên hệ";

                                  return (
                                    <Link
                                      key={plan.id}
                                      href={`/order?planId=${plan.id}`}
                                      onClick={() => setIsServicesOpen(false)}
                                      className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all group block shadow-xs bg-white"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-2">
                                          {plan.name}
                                        </h4>
                                        <span className="text-xs font-black text-blue-600 shrink-0">{formattedPrice}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2.5">
                                        {plan.description || `${plan.cpu || ""} ${plan.ram || ""} ${plan.storage || ""}`}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                                        {plan.cpu && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{plan.cpu}</span>}
                                        {plan.ram && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{plan.ram}</span>}
                                        {plan.storage && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{plan.storage}</span>}
                                      </div>
                                    </Link>
                                  );
                                })
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12 text-xs text-slate-400">
                            Đang kết nối cơ sở dữ liệu...
                          </div>
                        )}
                      </div>

                      {/* Bottom Banner */}
                      <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <strong className="block font-bold text-white">Miễn Phí Chuyển Đổi Dữ Liệu & Hỗ Trợ 24/7</strong>
                            <span className="text-[11px] text-slate-400">Cam kết Uptime 99.99% tại Datacenter chuẩn Tier 3 Quốc tế.</span>
                          </div>
                        </div>
                        <Link
                          href="/pricing"
                          onClick={() => setIsServicesOpen(false)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm shrink-0 ml-4"
                        >
                          Xem Toàn Bộ Gói
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
          <div className="lg:hidden bg-white border-t border-slate-200 p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-blue-600 py-1"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang Chủ
            </Link>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Danh Mục Dịch Vụ
              </span>
              <div className="space-y-3">
                {dbCategories.map((cat) => {
                  const catPlans = dbPlans.filter((p) => p.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-blue-700 block mb-1.5 flex items-center gap-2">
                        <CategoryIcon name={cat.name} className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </span>
                      <div className="space-y-1.5 pl-2">
                        {catPlans.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic block py-0.5">Chưa có gói cước</span>
                        ) : (
                          catPlans.slice(0, 4).map((p) => {
                            const firstPrice = p.prices?.[0]?.price || 0;
                            const priceStr = firstPrice > 0 ? `${new Intl.NumberFormat("vi-VN").format(firstPrice)}đ/th` : "Liên hệ";
                            return (
                              <Link
                                key={p.id}
                                href={`/order?planId=${p.id}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between py-1.5 text-xs text-slate-700 hover:text-blue-600"
                              >
                                <span className="font-medium truncate pr-2">{p.name}</span>
                                <span className="text-[11px] font-bold text-blue-600 shrink-0">{priceStr}</span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1">
              <Link href="/pricing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 py-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bảng Giá Dịch Vụ
              </Link>
              <Link href="/news" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 py-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Tin Tức & Khuyến Mãi
              </Link>
              <Link href="/affiliate" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 py-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Đối Tác Tiếp Thị (Affiliate)
              </Link>
              <Link href="/about" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 py-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Về Chúng Tôi
              </Link>
              {user && (
                <Link href="/my-plans" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 py-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Gói Cước Của Tôi
                </Link>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/order"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Khởi Tạo Dịch Vụ Ngay →</span>
              </Link>
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
                <div className="relative">
                  <input
                    type={showOldPwd ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showOldPwd ? "Ẩn" : "Hiện"}
                  >
                    {showOldPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Mật Khẩu Mới *</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    required
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showNewPwd ? "Ẩn" : "Hiện"}
                  >
                    {showNewPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Xác Nhận Mật Khẩu Mới *</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showConfirmPwd ? "Ẩn" : "Hiện"}
                  >
                    {showConfirmPwd ? "🙈" : "👁️"}
                  </button>
                </div>
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
