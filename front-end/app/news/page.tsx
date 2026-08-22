"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { useSearchParams, useRouter } from "next/navigation";

function NewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "Tất cả";

  const [news, setNews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState<string[]>(["Tất cả", "Khuyến Mãi", "Sự Kiện", "Hướng Dẫn", "Tin Tức"]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        let url = `/api/news?pageNumber=${currentPage}&pageSize=9`;
        if (searchTerm.trim()) {
          url += `&search=${encodeURIComponent(searchTerm.trim())}`;
        }
        if (selectedCategory && selectedCategory !== "Tất cả") {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        const res = await apiFetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items)) {
            setNews(items);
            if (data.totalPages) setTotalPages(data.totalPages);
          }
        }
      } catch (err) {
        console.warn("Lỗi tải tin tức từ Database:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [searchTerm, selectedCategory, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-12">
      {/* Search & Category Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết (không phân biệt hoa/thường)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder-slate-400"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block mb-3"></span>
          <div>Đang tải bài viết từ cơ sở dữ liệu...</div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có bài viết nào</h3>
          <p className="text-xs text-slate-500">
            Hiện chưa có bài viết nào phù hợp với bộ lọc tìm kiếm này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    {item.categoryName || item.category || "Tin Tức"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {/* Thumbnail Image */}
                {item.thumbnailUrl && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug line-clamp-2">
                  <Link href={`/news/${item.id}`}>
                    {item.title}
                  </Link>
                </h2>

                {/* Summary */}
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6">
                  {item.summary || item.content || "Xem nội dung bài viết chi tiết tại đây."}
                </p>
              </div>

              {/* Read More Link */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Tác giả: Ban Biên Tập</span>
                <Link
                  href={`/news/${item.id}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Chi tiết</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 rounded-xl"
          >
            ← Trang trước
          </button>
          <span className="text-xs font-bold text-slate-600 px-4">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 rounded-xl"
          >
            Trang sau →
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Cổng Thông Tin & Kiến Thức Công Nghệ</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Tin Tức & Thông Báo Hệ Thống
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Cập nhật những thông báo kỹ thuật, lịch nâng cấp hạ tầng mạng và chương trình ưu đãi mới nhất từ CloudService.
          </p>
        </div>
      </section>

      {/* Main List */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Suspense fallback={<div className="text-center py-20 text-slate-400">Đang tải tin tức...</div>}>
          <NewsContent />
        </Suspense>
      </main>
    </div>
  );
}
