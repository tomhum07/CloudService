"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalItems = categories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/service-categories?includeInactive=true");
      if (!res.ok) throw new Error("Không thể tải danh sách danh mục dịch vụ.");
      const data = await res.json();
      setCategories(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải danh mục.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (category?: Category) => {
    setFormError(null);
    if (category) {
      setCurrentCategory(category);
      setFormData({ name: category.name, slug: category.slug, description: category.description || "", isActive: category.isActive });
    } else {
      setCurrentCategory(null);
      setFormData({ name: "", slug: "", description: "", isActive: true });
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentCategory(null);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setFormError(null);
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentCategory(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const method = currentCategory ? "PUT" : "POST";
      const endpoint = currentCategory 
        ? `/api/service-categories/${currentCategory.id}` 
        : "/api/service-categories";

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Lưu danh mục thất bại.");
      
      handleCloseFormModal();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "Không thể lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      let res;
      if (currentCategory.isActive) {
        res = await apiFetch(`/api/service-categories/${currentCategory.id}`, {
          method: "DELETE"
        });
      } else {
        res = await apiFetch(`/api/service-categories/${currentCategory.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: currentCategory.name,
            slug: currentCategory.slug,
            description: currentCategory.description || "",
            isActive: true
          })
        });
      }
      if (!res.ok) throw new Error(currentCategory.isActive ? "Ẩn danh mục thất bại." : "Kích hoạt lại danh mục thất bại.");
      
      handleCloseDeleteModal();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "Lỗi thay đổi trạng thái danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">Quản Lý Danh Mục Dịch Vụ</h1>
          <p className="text-xs text-slate-500 mt-0.5">Phân loại các nhóm sản phẩm (Cloud VPS, Hosting, Tên miền, Email, SSL, Firewall...)</p>
        </div>
        <button 
          onClick={() => handleOpenFormModal()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <span>➕</span>
          <span>Thêm Danh Mục Mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tên Danh Mục</th>
                <th className="py-3.5 px-4">Đường Dẫn (Slug)</th>
                <th className="py-3.5 px-4">Mô Tả Dịch Vụ</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Đang tải danh mục...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Không tìm thấy danh mục nào.</td>
                </tr>
              ) : (
                categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {category.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono text-[11px]">
                        {category.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={category.description}>
                      {category.description || "-"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {category.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold whitespace-nowrap">
                          Đang hiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold whitespace-nowrap">
                          Đang ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenFormModal(category)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(category)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          category.isActive
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {category.isActive ? "Ẩn" : "Hiện"}
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
              Trang {currentPage} / {totalPages} ({totalItems} danh mục)
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

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Dịch Vụ Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Điền đầy đủ thông tin tên và đường dẫn (slug) cho danh mục.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Danh Mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cloud VPS, Web Hosting, Email Doanh Nghiệp"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                    setFormData({ ...formData, name, slug: currentCategory ? formData.slug : slug });
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Đường Dẫn (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="cloud-vps, web-hosting"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô Tả Ngắn</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả về tính năng nổi bật của danh mục dịch vụ này..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Danh Mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Toggle Modal */}
      {isDeleteModalOpen && currentCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="text-3xl mb-3">{currentCategory.isActive ? "👁️‍🗨️" : "👁️"}</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentCategory.isActive ? "Ẩn Danh Mục Này?" : "Hiện Lại Danh Mục?"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc muốn {currentCategory.isActive ? "ẩn" : "kích hoạt lại"} danh mục <strong>{currentCategory.name}</strong> ngoài trang bán hàng?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm ${
                  currentCategory.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? "Đang xử lý..." : currentCategory.isActive ? "Xác Nhận Ẩn" : "Xác Nhận Hiện"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
