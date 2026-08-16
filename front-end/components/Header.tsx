"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Đăng Nhập
          </Link>
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
          <Link
            href="/admin/login"
            className="text-sm font-medium text-slate-300 hover:text-white text-center py-2"
            onClick={() => setIsOpen(false)}
          >
            Đăng Nhập
          </Link>
          <Link
            href="/order"
            className="w-full py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white text-center block hover:bg-blue-500 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Đặt Hàng Ngay
          </Link>
        </div>
      )}
    </header>
  );
}
