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

  // Helper parser: Hỗ trợ hiển thị cả HTML Rich Text từ TinyMCE lẫn định dạng văn bản / Markdown
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Nếu nội dung chứa các thẻ HTML từ TinyMCE (ví dụ: <p>, <h1>, <div>, <strong>, <table>, <img>)
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (isHtml) {
      return (
        <div
          className="prose prose-slate max-w-none text-slate-800 leading-relaxed space-y-4 [&>p]:leading-relaxed [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-bold [&>h3]:text-lg [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>table]:w-full [&>table]:border-collapse [&>table_td]:border [&>table_td]:p-2 [&>table_th]:border [&>table_th]:p-2 [&>img]:rounded-2xl [&>img]:shadow-md [&>img]:mx-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    
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
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
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

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Ngày đăng: {new Date(article.publishedAt || article.createdAt || Date.now()).toLocaleDateString("vi-VN")}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Tác giả: {article.authorName || "Ban Biên Tập CloudService"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
          
          {/* Ảnh Bìa / Ảnh Đại Diện Bài Viết Từ Supabase */}
          {article.thumbnailUrl && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.thumbnailUrl}
                alt={article.title}
                className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          )}

          {article.summary && (
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm font-semibold text-slate-700 leading-relaxed italic">
              {article.summary}
            </div>
          )}

          <div className="space-y-4 text-base text-slate-700 leading-relaxed font-normal">
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
