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
            setRole(payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Editor");
          }
        } catch (e) {
          console.error("Lỗi giải mã JWT:", e);
        }
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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Quản lý Danh mục", href: "/admin/categories", icon: "📂" },
    { label: "Quản lý Gói cước", href: "/admin/plans", icon: "📦" },
    { label: "Bảng giá & Khuyến mãi", href: "/admin/prices", icon: "💰" },
  ];

  if (role === "Admin") {
    navLinks.push({ label: "Quản lý Tài khoản", href: "/admin/users", icon: "👤" });
  }

  navLinks.push({ label: "Đổi mật khẩu", href: "/admin/change-password", icon: "🔑" });

  return (
    <div className="min-h-screen bg-[#030712] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#030712]/50 backdrop-blur-xl flex-col hidden md:flex z-20">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (Visible only on small screens) */}
        <header className="md:hidden p-4 border-b border-white/5 flex justify-between items-center bg-[#030712]/80 backdrop-blur-md z-20">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            CloudAdmin
          </h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20"
          >
            Đăng xuất
          </button>
        </header>
        
        {/* Mobile Navigation (Horizontal scroll) */}
        <nav className="md:hidden flex overflow-x-auto p-3 gap-2 border-b border-white/5 bg-[#030712]/50 no-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 bg-white/5 border border-transparent"
                }`}
              >
                <span>{link.icon}</span>
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
