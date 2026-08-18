"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await apiFetch(`/api/news/${idStr}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Lỗi tải chi tiết bài viết:", err);
      }
      setArticle(null);
      setLoading(false);
    }

    loadArticle();
  }, [idStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mb-4 border border-rose-200">
          📰
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Không Tìm Thấy Bài Viết</h1>
        <p className="text-xs text-slate-500 max-w-md mb-6">
          Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị ẩn khỏi hệ thống cơ sở dữ liệu.
        </p>
        <Link
          href="/news"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
        >
          ← Quay lại danh sách tin tức
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Header Breadcrumb */}
      <section className="bg-white border-b border-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-blue-600">Tin tức</Link>
            <span>/</span>
            <span className="text-slate-700 truncate max-w-xs">{article.title}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
            {article.categoryName || article.category || "Tin Tức"}
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>📅 Ngày đăng: {new Date(article.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
            <span>•</span>
            <span>✍️ Tác giả: Ban Biên Tập CloudService</span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-6">
          {article.summary && (
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm font-semibold text-slate-700 leading-relaxed italic">
              {article.summary}
            </div>
          )}

          <div className="text-sm text-slate-700 leading-loose space-y-4 whitespace-pre-line">
            {article.content}
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href="/news"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Xem các bài viết khác</span>
            </Link>

            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              Xem Bảng Giá Gói Dịch Vụ →
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
