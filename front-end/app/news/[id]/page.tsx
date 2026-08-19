"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await apiFetch(`/api/news/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết bài viết:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchArticle();
  }, [id]);

  // Helper parser for Markdown images: ![alt](url)
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    
    // Split by image markdown pattern ![alt](url)
    const parts = content.split(/(!\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const alt = match[1] || "Hình ảnh bài viết";
        const url = match[2];
        return (
          <figure key={index} className="my-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt}
              className="rounded-2xl max-h-[480px] w-auto mx-auto object-cover border border-slate-200 shadow-md"
            />
            {alt && <figcaption className="text-xs text-slate-400 mt-2 italic">{alt}</figcaption>}
          </figure>
        );
      }

      return (
        <div key={index} className="whitespace-pre-line leading-loose text-slate-700 text-sm">
          {part}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải nội dung bài viết...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-5xl mb-4">📰</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Bài Viết Không Tồn Tại Hoặc Đã Bị Ẩn</h1>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Nội dung bạn đang tìm kiếm có thể đã được gỡ bỏ hoặc tạm ẩn trong hệ thống.
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
            <span>📅 Ngày đăng: {new Date(article.publishedAt || article.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
            <span>•</span>
            <span>✍️ Tác giả: {article.authorName || "Ban Biên Tập CloudService"}</span>
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

          <div className="space-y-4">
            {renderFormattedContent(article.content)}
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
