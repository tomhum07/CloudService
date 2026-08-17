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

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    const verifySession = async () => {
      // Nếu chưa có Access Token trong RAM, chạy Silent Refresh để lấy token mới từ Cookie
      let token = getAccessToken();
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
            
            // CHẶN NGAY NẾU LÀ KHÁCH HÀNG (CUSTOMER)
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
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  // TRANG CHẶN KHÁCH HÀNG
  if (role === "Unauthorized") {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-500/10">
          🚫
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Truy Cập Bị Từ Chối</h1>
        <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
          Tài khoản của bạn là <span className="text-yellow-400 font-semibold">Khách Hàng (Customer)</span> và không có quyền truy cập vào Cổng quản trị CloudAdmin. Vui lòng quay về trang chủ hoặc đăng nhập bằng tài khoản Quản trị viên.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-all">
            🏠 Về Trang Chủ
          </Link>
          <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all">
            🔑 Đăng Nhập Quản Trị
          </button>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Quản lý Danh mục", href: "/admin/categories", icon: "📂" },
    { label: "Quản lý Gói cước", href: "/admin/plans", icon: "📦" },
    { label: "Bảng giá & Khuyến mãi", href: "/admin/prices", icon: "💰" },
    { label: "Duyệt Đơn & CTV", href: "/admin/orders", icon: "🛒" },
    { label: "Quản lý Tin tức", href: "/admin/news", icon: "📰" },
    { label: "Nhật ký hệ thống", href: "/admin/audit-logs", icon: "📜" },
  ];

  if (role === "Admin") {
    navLinks.push({ label: "Quản lý Tài khoản", href: "/admin/users", icon: "👤" });
  }

  navLinks.push({ label: "Đổi mật khẩu", href: "/admin/change-password", icon: "🔑" });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0b0f19] flex-col hidden md:flex z-20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-blue-400">
            CloudAdmin
          </h2>
          <p className="text-xs text-gray-400 mt-1">Management Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Vai trò: {role}</p>
            <p className="text-[10px] text-gray-400">Đang hoạt động</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            title="Đăng xuất"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/10 bg-[#0b0f19] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-400">
              Trang: <span className="text-white capitalize">{pathname.split("/").pop() || "Dashboard"}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
            >
              <span>Xem trang chủ</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
              {role.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
