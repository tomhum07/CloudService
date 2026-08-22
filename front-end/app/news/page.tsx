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
        let url = `/api/news?pageNumber=${currentPage}&pageSize=12`;
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
            // Sắp xếp bài viết mới nhất lên đầu tiên (Newest first)
            const sortedItems = [...items].sort((a: any, b: any) => {
              const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
              const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
              return dateB - dateA;
            });
            setNews(sortedItems);
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

  const featuredArticle = news.length > 0 && currentPage === 1 && !searchTerm.trim() && selectedCategory === "Tất cả" 
    ? news[0] 
    : null;
  const regularArticles = featuredArticle ? news.slice(1) : news;

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

      {/* Featured Article Card (Tin Mới Nhất Nổi Bật Ở Đầu) */}
      {!loading && featuredArticle && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md hover:border-blue-300 transition-all group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {featuredArticle.thumbnailUrl ? (
              <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredArticle.thumbnailUrl}
                  alt={featuredArticle.title}
                  className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="lg:col-span-6 h-64 sm:h-80 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-8 flex flex-col justify-end text-white">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">BÀI VIẾT NỔI BẬT</span>
                <h3 className="text-xl font-bold">{featuredArticle.title}</h3>
              </div>
            )}

            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  🔥 TIN MỚI NHẤT: {featuredArticle.categoryName || featuredArticle.category || "Tin Tức"}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(featuredArticle.publishedAt || featuredArticle.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                <Link href={`/news/${featuredArticle.id}`}>
                  {featuredArticle.title}
                </Link>
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                {featuredArticle.summary || featuredArticle.content}
              </p>

              <div className="pt-2">
                <Link
                  href={`/news/${featuredArticle.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                >
                  <span>Đọc Toàn Văn Bài Viết</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block mb-3"></span>
          <div>Đang tải bài viết từ cơ sở dữ liệu...</div>
        </div>
      ) : regularArticles.length === 0 && !featuredArticle ? (
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
          {regularArticles.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl transition-all group"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    (item.categoryName || item.category) === "Khuyến Mãi"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : (item.categoryName || item.category) === "Sự Kiện"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : (item.categoryName || item.category) === "Hướng Dẫn"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {item.categoryName || item.category || "Tin Tức"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(item.publishedAt || item.createdAt || Date.now()).toLocaleDateString("vi-VN")}
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
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  <Link href={`/news/${item.id}`}>
                    {item.title}
                  </Link>
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-6">
                  {item.summary || item.content}
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tác giả: {item.authorName || "Ban Biên Tập CloudService"}
                </span>
                <Link
                  href={`/news/${item.id}`}
                  className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                >
                  <span>Đọc tiếp</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            ← Trang Trước
          </button>
          <span className="text-xs font-bold text-slate-500 px-3">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            Trang Tiếp →
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">
          BLOG & KIẾN THỨC CLOUD
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Tin Tức, Cập Nhật Tính Năng & Hướng Dẫn Kỹ Thuật
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Chia sẻ kinh nghiệm quản trị máy chủ, tối ưu hiệu năng web hosting, cấu hình tên miền và bảo mật an ninh mạng.
        </p>
      </div>

      <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Đang tải tin tức...</div>}>
        <NewsContent />
      </Suspense>
    </div>
  );
}
