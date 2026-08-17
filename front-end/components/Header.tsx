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

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Profile edit form state
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
          
          // Lấy profile chi tiết từ API
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
          } catch {
            // fallback to token payload
          }

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
      router.push("/");
      router.refresh();
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg(null);

    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail
        })
      });

      if (res.ok) {
        setEditMsg({ text: "Cập nhật thông tin thành công!", type: "success" });
        setUser(prev => prev ? { ...prev, fullName: editFullName, email: editEmail } : null);
        setTimeout(() => {
          setShowEditModal(false);
          setEditMsg(null);
        }, 1200);
      } else {
        const data = await res.json();
        setEditMsg({ text: data.message || "Cập nhật thất bại.", type: "error" });
      }
    } catch {
      setEditMsg({ text: "Không thể kết nối đến máy chủ.", type: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { name: "Trang Chủ", href: "/" },
    { name: "Giới Thiệu", href: "/about" },
    { name: "Dịch Vụ", href: "/services" },
    { name: "Bảng Giá", href: "/pricing" },
    { name: "Tin Tức", href: "/news" },
    { name: "Đối Tác", href: "/affiliate" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/30 transition-colors group-hover:bg-blue-500">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100 transition-colors group-hover:text-white">
              CloudService
            </span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? "text-blue-400" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Buttons & User Info */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-left transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] text-blue-400 font-medium leading-tight">
                      {user.role}
                    </span>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                      {user.email && <p className="text-[10px] text-slate-500 truncate">{user.email}</p>}
                    </div>

                    {(user.role === "Admin" || user.role === "Editor") && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-400 hover:bg-blue-500/10 font-medium transition-colors"
                      >
                        <span>📊</span>
                        <span>Trang Quản Trị Admin</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowEditModal(true);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-colors"
                    >
                      <span>✏️</span>
                      <span>Đổi thông tin cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium transition-colors mt-1 border-t border-white/5 pt-2"
                    >
                      <span>🚪</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Đăng Ký
                </Link>
              </>
            )}

            <Link
              href="/order"
              className="px-5 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white flex items-center justify-center transition-all duration-200 shadow-sm shadow-blue-950"
            >
              Đặt Hàng Ngay
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle Menu"
            aria-expanded={isOpen}
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

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden glassmorphism border-b border-white/10 py-6 px-6 flex flex-col gap-4">
            {user && (
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 mb-2">
                <p className="text-xs font-bold text-white">{user.fullName || user.username}</p>
                <p className="text-[10px] text-blue-400 font-medium">Vai trò: {user.role}</p>
              </div>
            )}

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    isActive ? "text-blue-400" : "text-slate-300 hover:text-white"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
            <hr className="border-white/10 my-2" />
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  {(user.role === "Admin" || user.role === "Editor") && (
                    <Link
                      href="/admin/dashboard"
                      className="text-sm font-semibold text-blue-400 text-center py-2 bg-blue-500/10 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      Trang Quản Trị Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setShowEditModal(true);
                    }}
                    className="text-sm font-medium text-slate-300 hover:text-white text-center py-2"
                  >
                    Đổi thông tin cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="text-sm font-medium text-red-400 hover:text-red-300 text-center py-2"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-slate-300 hover:text-white text-center py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium text-slate-300 hover:text-white text-center py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng Ký
                  </Link>
                </>
              )}
              <Link
                href="/order"
                className="w-full py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white text-center block hover:bg-blue-500 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Đặt Hàng Ngay
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Modal: Đổi Thông Tin Cá Nhân */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-white">Đổi Thông Tin Cá Nhân</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditMsg(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {editMsg && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                editMsg.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên Đăng Nhập</label>
                <input
                  type="text"
                  disabled
                  value={user?.username || ""}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa Chỉ Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {editLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
