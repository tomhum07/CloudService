"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/utils/api";
import { uploadToSupabaseStorage, DEFAULT_BUCKET } from "@/utils/supabase";

// Import TinyMCE động để tương thích hoàn toàn với Next.js SSR
const Editor = dynamic(() => import("@tinymce/tinymce-react").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
      <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
      <span>Đang tải trình soạn thảo TinyMCE...</span>
    </div>
  )
});

const PRESET_CATEGORIES = ["Khuyến Mãi", "Sự Kiện", "Hướng Dẫn", "Tin Tức"];

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Lọc bài viết không phân biệt chữ hoa, chữ thường và dấu khoảng trắng (Case-insensitive search)
  const filteredArticles = articles.filter((art) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (art.title && art.title.toLowerCase().includes(term)) ||
      (art.slug && art.slug.toLowerCase().includes(term)) ||
      (art.summary && art.summary.toLowerCase().includes(term));

    const matchesCategory = selectedCategoryFilter === "Tất cả" || 
      (art.categoryName && art.categoryName.toLowerCase() === selectedCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  
  // Form/Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [categoryName, setCategoryName] = useState("Tin Tức");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File Upload to Supabase Storage states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal zoom preview ảnh
  const [showImageZoom, setShowImageZoom] = useState(false);

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
    setThumbnailUrl("");
    setContent("");
    setCategoryName("Tin Tức");
    setIsActive(true);
    setFormError(null);
    setUploadError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (art: any) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSummary(art.summary || "");
    setThumbnailUrl(art.thumbnailUrl || "");
    setContent(art.content || "");
    setCategoryName(art.categoryName || art.category || "Tin Tức");
    setIsActive(art.isActive !== false);
    setFormError(null);
    setUploadError(null);
    setShowModal(true);
  };

  // Direct file selection & automatic upload to Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, JPEG, WEBP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Dung lượng ảnh không được vượt quá 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const result = await uploadToSupabaseStorage(file, DEFAULT_BUCKET);

    setIsUploading(false);

    if (result.error) {
      setUploadError(`Tải ảnh lên Supabase thất bại: ${result.error}`);
    } else {
      setThumbnailUrl(result.url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const body = {
      title: title.trim(),
      summary: summary.trim(),
      thumbnailUrl: thumbnailUrl.trim() || null,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">Quản Lý Tin Tức & Blog Kiến Thức</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dữ liệu bài viết thực tế được lưu trữ trực tiếp trong Database</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <span>➕</span>
          <span>Viết Bài Mới</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, slug hoặc tóm tắt (không phân biệt hoa/thường)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder-slate-400"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white w-full sm:w-48 font-medium"
          >
            <option value="Tất cả">Tất cả chuyên mục</option>
            {PRESET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Ảnh & Tiêu Đề Bài Viết</th>
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
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchTerm ? "Không tìm thấy bài viết nào phù hợp với từ khóa." : "Chưa có bài viết nào trong cơ sở dữ liệu."}
                  </td>
                </tr>
              ) : (
                filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {art.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={art.thumbnailUrl}
                            alt={art.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setThumbnailUrl(art.thumbnailUrl);
                              setShowImageZoom(true);
                            }}
                            title="Bấm để phóng to xem trước"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg flex-shrink-0 text-slate-400">
                            📰
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{art.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">/{art.slug}</div>
                        </div>
                      </div>
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
                      {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString("vi-VN") : "Bản nháp (Chưa đăng)"}
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

      {/* Modal Soạn Thảo & Chỉnh Sửa Bài Viết (TinyMCE Rich Editor) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingArticle ? "Chỉnh Sửa Bài Viết" : "Soạn Thảo Bài Viết Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">Trình soạn thảo TinyMCE chuyên nghiệp hỗ trợ định dạng văn bản, chèn ảnh, bảng và video.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu Đề Bài Viết *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hướng dẫn cấu hình Web Hosting LiteSpeed tối ưu..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chuyên Mục *</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
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
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all leading-relaxed"
                ></textarea>
              </div>

              {/* Tải & Xem Ảnh Thumbnail Thu Nhỏ */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {thumbnailUrl ? (
                    <div className="relative group cursor-pointer" onClick={() => setShowImageZoom(true)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-300 group-hover:opacity-80 transition-all shadow-xs"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">🔍</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-xl text-slate-400">
                      📷
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-slate-900">Ảnh Bìa Bài Viết (Supabase)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {thumbnailUrl ? (
                        <button
                          type="button"
                          onClick={() => setShowImageZoom(true)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Bấm vào ảnh để xem to (Preview)
                        </button>
                      ) : (
                        "Chưa chọn ảnh (Hỗ trợ JPG, PNG, WEBP)"
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="upload-image-input"
                  />
                  <label
                    htmlFor="upload-image-input"
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                      isUploading
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <span>📁</span>
                        <span>{thumbnailUrl ? "Đổi Ảnh" : "Chọn Ảnh"}</span>
                      </>
                    )}
                  </label>

                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                      title="Gỡ ảnh"
                    >
                      Gỡ
                    </button>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  ⚠️ {uploadError}
                </div>
              )}

              {/* TinyMCE Rich Text Editor */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nội Dung Chi Tiết (TinyMCE Rich Text Editor) *
                </label>
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ""}
                    value={content}
                    onEditorChange={(newContent) => setContent(newContent)}
                    init={{
                      height: 380,
                      menubar: true,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                      ],
                      toolbar:
                        'undo redo | blocks fontfamily fontsize | ' +
                        'bold italic underline forecolor backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'link image media table | removeformat code help',
                      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; }',
                      branding: false,
                      promotion: false
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
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
                  disabled={submitting || isUploading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {submitting ? "Đang lưu..." : "Lưu Bài Viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phóng To Xem Trước Ảnh (LightBox Zoom Preview) */}
      {showImageZoom && thumbnailUrl && (
        <div
          onClick={() => setShowImageZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="Preview Zoom"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-white/80 font-medium">Ảnh xem trước từ Supabase Storage</span>
              <button
                type="button"
                onClick={() => setShowImageZoom(false)}
                className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition-all"
              >
                ✕ Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
