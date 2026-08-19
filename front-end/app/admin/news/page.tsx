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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const body = {
      title,
      summary,
      content,
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
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">{art.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {art.categoryName || art.category || "Tin Tức"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{art.summary || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(art.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3.5 px-4">
                      {art.isActive !== false ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Đã xuất bản
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Bản nháp / Ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleStatus(art.id, art.isActive !== false)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          art.isActive !== false
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingArticle ? "Chỉnh Sửa Bài Viết" : "Soạn Thảo Bài Viết Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Nhập đầy đủ tiêu đề, tóm tắt và nội dung chi tiết bài viết.</p>

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
                <label className="text-xs font-bold text-slate-700 block mb-1">Nội Dung Chi Tiết (Hỗ trợ Markdown) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Nhập nội dung bài viết chi tiết..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Xuất bản bài viết ngay sau khi lưu
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
