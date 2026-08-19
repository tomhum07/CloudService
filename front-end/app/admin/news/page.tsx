"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

const PRESET_CATEGORIES = ["Khuyến Mãi", "Sự Kiện", "Hướng Dẫn", "Tin Tức"];

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(articles.length / itemsPerPage) || 1;
  
  // Form/Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryName, setCategoryName] = useState("Tin Tức");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper Modal for inserting image from Supabase / URL
  const [showImageHelper, setShowImageHelper] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/news?pageSize=100&includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items)) {
          setArticles(items);
        }
      }
    } catch (err) {
      console.warn("Lỗi API tin tức:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setTitle("");
    setSummary("");
    setContent("");
    setCategoryName("Tin Tức");
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (art: any) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSummary(art.summary || "");
    setContent(art.content || "");
    setCategoryName(art.categoryName || art.category || "Tin Tức");
    setIsActive(art.isActive !== false);
    setFormError(null);
    setShowModal(true);
  };

  const handleInsertImageToContent = () => {
    if (!imageUrl.trim()) return;
    const altText = imageAlt.trim() || "Hình ảnh bài viết";
    const markdownImage = `\n\n![${altText}](${imageUrl.trim()})\n\n`;
    setContent((prev) => prev + markdownImage);
    setImageUrl("");
    setImageAlt("");
    setShowImageHelper(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const body = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      categoryName,
      isActive
    };

    try {
      let res;
      if (editingArticle) {
        res = await apiFetch(`/api/news/${editingArticle.id}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
      } else {
        res = await apiFetch("/api/news", {
          method: "POST",
          body: JSON.stringify(body)
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchNews();
      } else {
        const errData = await res.json();
        setFormError(errData.message || "Lưu bài viết thất bại.");
      }
    } catch {
      setFormError("Không thể kết nối đến máy chủ Backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    try {
      await apiFetch(`/api/news/${id}`, {
        method: "DELETE"
      });
      fetchNews();
    } catch (err) {
      console.warn("Lỗi thay đổi trạng thái bài viết:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Quản Lý Tin Tức & Blog Kiến Thức</h1>
          <p className="text-xs text-slate-500 mt-1">Dữ liệu bài viết thực tế được lưu trữ trực tiếp trong Database</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <span>➕</span>
          <span>Viết Bài Mới</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tiêu Đề Bài Viết</th>
                <th className="py-3.5 px-4">Chuyên Mục</th>
                <th className="py-3.5 px-4">Tóm Tắt Nội Dung</th>
                <th className="py-3.5 px-4">Ngày Đăng</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Đang tải danh sách bài viết...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Chưa có bài viết nào trong cơ sở dữ liệu.</td>
                </tr>
              ) : (
                articles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{art.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">/{art.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        {art.categoryName || art.category || "Tin Tức"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-600 line-clamp-2 leading-relaxed">
                        {art.summary || "Không có tóm tắt"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString("vi-VN") : "Chưa xuất bản"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {art.isActive !== false ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang Hiện
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Bản Nháp (Ẩn)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleStatus(art.id, art.isActive)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          art.isActive !== false
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {art.isActive !== false ? "Ẩn" : "Hiện"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {currentPage} / {totalPages} ({articles.length} bài viết)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Soạn Thảo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingArticle ? "Chỉnh Sửa Bài Viết" : "Soạn Thảo Bài Viết Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Nhập đầy đủ tiêu đề, tóm tắt, chèn hình ảnh và nội dung chi tiết bài viết.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu Đề Bài Viết *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Thông báo nâng cấp hệ thống hạ tầng máy chủ..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chuyên Mục *</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {PRESET_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tóm Tắt Ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt hiển thị ngoài danh sách tin tức..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                ></textarea>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Nội Dung Chi Tiết (Hỗ trợ Markdown) *</label>
                  <button
                    type="button"
                    onClick={() => setShowImageHelper(!showImageHelper)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                  >
                    <span>🖼️</span> Chèn Ảnh từ Supabase Storage / URL
                  </button>
                </div>

                {/* Sub-box: Insert image helper */}
                {showImageHelper && (
                  <div className="p-3.5 mb-2 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                    <div className="font-bold text-blue-900">🔗 Chèn URL Ảnh từ Supabase Storage:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        placeholder="Dán link Public URL ảnh (https://...supabase.co/storage/...)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-blue-300 text-xs text-slate-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Chú thích ảnh (VD: Máy chủ Cloud VPS)"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-blue-300 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowImageHelper(false)}
                        className="px-2.5 py-1 text-slate-600 font-bold hover:bg-slate-200 rounded"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertImageToContent}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs"
                      >
                        Chèn vào bài viết
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  rows={7}
                  required
                  placeholder="Nhập nội dung bài viết chi tiết... Hỗ trợ định dạng Markdown, danh sách, ảnh ![Mô tả](url)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Xuất bản bài viết ngay sau khi lưu (Bỏ chọn nếu muốn lưu thành Bản Nháp)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {submitting ? "Đang lưu..." : "Lưu Bài Viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
