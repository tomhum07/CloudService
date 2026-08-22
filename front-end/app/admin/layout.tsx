"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, refreshAccessToken, apiFetch, setAccessToken } from "@/utils/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<string>("");
  const [username, setUsername] = useState("Admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const verifySession = async () => {
      let token = getAccessToken();

      if (!token) {
        setChecking(true);
        const success = await refreshAccessToken();
        if (!success) {
          router.push("/admin/login");
          return;
        }
        token = getAccessToken();
      }

      if (token) {
        try {
          const payloadPart = token.split(".")[1];
          if (payloadPart) {
            const payload = JSON.parse(window.atob(payloadPart));
            const userRole = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Customer";
            const name = payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload["name"] || "Admin";
            
            setUsername(name);

            // Chặn khách hàng
            if (userRole !== "Admin" && userRole !== "Editor") {
              setRole("Unauthorized");
              setChecking(false);
              return;
            }

            // Kiểm tra phân quyền trang cho vai trò Editor
            if (userRole === "Editor") {
              const allowedEditorRoutes = [
                "/admin/news",
                "/admin/orders",
                "/admin/change-password"
              ];

              const isAllowed = allowedEditorRoutes.some(route => 
                pathname === route || pathname?.startsWith(route + "/")
              );

              if (!isAllowed) {
                // Tự động chuyển hướng Editor vào trang tin tức nếu truy cập trang bị cấm
                router.replace("/admin/news");
                setRole("Editor");
                setChecking(false);
                return;
              }
            }

            setRole(userRole);
          }
        } catch (e) {
          console.error("Lỗi giải mã JWT:", e);
          setRole("Unauthorized");
        }
      } else {
        router.push("/admin/login");
        return;
      }

      setChecking(false);
    };

    verifySession();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    } finally {
      setAccessToken("");
      router.push("/admin/login");
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
      </div>
    );
  }

  // TRANG TỪ CHỐI TRUY CẬP KHÁCH HÀNG (Clean Light Theme)
  if (role === "Unauthorized") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-4xl mb-6 shadow-sm">
          🚫
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Truy Cập Bị Từ Chối</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          Tài khoản của bạn là <span className="text-rose-600 font-bold">Khách Hàng (Customer)</span> và không có quyền truy cập vào Cổng quản trị CloudAdmin. Vui lòng quay về trang chủ hoặc đăng nhập bằng tài khoản Quản trị viên.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Về Trang Chủ</span>
          </Link>
          <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Đăng Nhập Quản Trị</span>
          </button>
        </div>
      </div>
    );
  }

function AdminNavIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  switch (name) {
    case "dashboard":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "categories":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "plans":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    case "prices":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "orders":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case "news":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      );
    case "audit-logs":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "change-password":
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
  }
}

  // Phân quyền danh sách Menu điều hướng (Sidebar Navigation Links)
  const navLinks = role === "Editor"
    ? [
        { label: "Quản Lý Tin Tức", href: "/admin/news", iconKey: "news" },
        { label: "Duyệt Đơn Hàng & CTV", href: "/admin/orders", iconKey: "orders" },
        { label: "Đổi Mật Khẩu", href: "/admin/change-password", iconKey: "change-password" },
      ]
    : [
        { label: "Bảng Điều Khiển", href: "/admin/dashboard", iconKey: "dashboard" },
        { label: "Quản Lý Danh Mục", href: "/admin/categories", iconKey: "categories" },
        { label: "Quản Lý Gói Cước", href: "/admin/plans", iconKey: "plans" },
        { label: "Bảng Giá & Chu Kỳ", href: "/admin/prices", iconKey: "prices" },
        { label: "Duyệt Đơn Hàng & CTV", href: "/admin/orders", iconKey: "orders" },
        { label: "Quản Lý Tin Tức", href: "/admin/news", iconKey: "news" },
        { label: "Nhật Ký Hệ Thống", href: "/admin/audit-logs", iconKey: "audit-logs" },
        { label: "Quản Lý Tài Khoản", href: "/admin/users", iconKey: "users" },
        { label: "Đổi Mật Khẩu", href: "/admin/change-password", iconKey: "change-password" },
      ];

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex-col hidden md:flex z-20 shadow-xs shrink-0 h-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            C
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              CloudAdmin
            </h2>
            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Cổng Quản Trị Hệ Thống</p>
          </div>
        </div>
        
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                }`}
              >
                <AdminNavIcon name={link.iconKey} className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Role Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{username}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
              C
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">CloudAdmin</h2>
              <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Cổng Quản Trị</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                }`}
              >
                <AdminNavIcon name={link.iconKey} className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{username}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Đăng xuất"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 z-10 shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="hidden sm:inline text-xs font-medium text-slate-400">Khu vực:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg truncate max-w-[140px] sm:max-w-none">
              {navLinks.find(l => l.href === pathname)?.label || "Quản Trị"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Xem Trang Bán Hàng</span>
            </Link>
            
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {role.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Admin Body - Chỉ nội dung này được cuộn, Sidebar và Topbar cố định */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 overscroll-contain">
          {children}
        </main>
      </div>

    </div>
  );
}
