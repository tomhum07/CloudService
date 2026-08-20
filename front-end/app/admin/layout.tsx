"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, refreshAccessToken, apiFetch, setAccessToken } from "@/utils/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState("Editor");
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const verifySession = async () => {
      let token = getAccessToken();
      if (token && role !== "Unauthorized" && !checking) {
        // Đã xác thực session trước đó, không cần load spinner lại khi chuyển qua lại giữa các menu
        return;
      }

      if (!token) {
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
  }, [pathname, router, role, checking]);

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
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs">
            🏠 Về Trang Chủ
          </Link>
          <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all">
            🔑 Đăng Nhập Quản Trị
          </button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: "Bảng Điều Khiển", href: "/admin/dashboard", icon: "📊" },
    { label: "Quản Lý Danh Mục", href: "/admin/categories", icon: "📂" },
    { label: "Quản Lý Gói Cước", href: "/admin/plans", icon: "📦" },
    { label: "Bảng Giá & Chu Kỳ", href: "/admin/prices", icon: "💰" },
    { label: "Duyệt Đơn Hàng & CTV", href: "/admin/orders", icon: "🛒" },
    { label: "Quản Lý Tin Tức", href: "/admin/news", icon: "📰" },
    { label: "Nhật Ký Hệ Thống", href: "/admin/audit-logs", icon: "📜" },
  ];

  if (role === "Admin") {
    navLinks.push({ label: "Quản Lý Tài Khoản", href: "/admin/users", icon: "👤" });
  }

  navLinks.push({ label: "Đổi Mật Khẩu", href: "/admin/change-password", icon: "🔑" });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex-col hidden md:flex z-20 shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            C
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              CloudAdmin
            </h2>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Cổng Quản Trị Hệ Thống</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
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
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Role Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Khu vực:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
              {navLinks.find(l => l.href === pathname)?.label || "Quản Trị"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-600 hover:text-blue-600 font-bold flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
            >
              <span>🌐 Xem Trang Bán Hàng</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {role.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
