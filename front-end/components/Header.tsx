"use client";
import React, { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 glassmorphism border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            CloudService
          </span>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Trang Chủ</a>
          <a href="#services" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dịch Vụ</a>
          <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Tính Năng</a>
          <a href="#services" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Bảng Giá</a>
        </nav>

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Đăng Nhập
          </a>
          <a href="#" className="px-5 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm font-semibold text-white flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5">
            Bắt Đầu Ngay
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden text-gray-300 hover:text-white focus:outline-none"
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
        <div className="md:hidden glassmorphism border-b border-white/5 py-6 px-6 flex flex-col gap-4">
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Trang Chủ</a>
          <a href="#services" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Dịch Vụ</a>
          <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Tính Năng</a>
          <a href="#services" className="text-sm font-medium text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Bảng Giá</a>
          <hr className="border-white/5 my-2" />
          <a href="#" className="text-sm font-medium text-gray-300 hover:text-white text-center py-2">Đăng Nhập</a>
          <a href="#" className="w-full py-2.5 rounded-lg bg-blue-500 text-sm font-semibold text-white text-center block">Bắt Đầu Ngay</a>
        </div>
      )}
    </header>
  );
}
