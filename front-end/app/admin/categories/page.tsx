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
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data.");
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

      if (!res.ok) throw new Error("Failed to save category");
      
      handleCloseFormModal();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "Failed to save category.");
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
        // Khóa/Ẩn danh mục
        res = await apiFetch(`/api/service-categories/${currentCategory.id}`, {
          method: "DELETE"
        });
      } else {
        // Mở ẩn danh mục (PUT)
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
      if (!res.ok) throw new Error(currentCategory.isActive ? "Ẩn danh mục thất bại" : "Kích hoạt lại danh mục thất bại");
      
      handleCloseDeleteModal();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "Failed to toggle category visibility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">Service Categories</h1>
          <p className="text-gray-400">Manage your product and service categories</p>
        </div>
        <button 
          onClick={() => handleOpenFormModal()}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-gray-300">
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Tên danh mục</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Slug</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Mô tả</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Trạng thái</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce"></div>
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Không tìm thấy danh mục nào.</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="p-5 text-gray-200 font-medium">
                      {category.name}
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-gray-800 rounded-md text-sm text-gray-400 font-mono border border-gray-700 group-hover:border-blue-500/30 transition-colors">
                        {category.slug}
                      </span>
                    </td>
                    <td className="p-5 text-gray-400 max-w-xs truncate" title={category.description}>
                      {category.description || "-"}
                    </td>
                    <td className="p-5">
                      {category.isActive ? (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-green-950/30 text-green-400 border border-green-800/50 font-medium">Đang hiện</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-red-950/30 text-red-400 border border-red-800/50 font-medium">Đang ẩn</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenFormModal(category)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {category.isActive ? (
                          <button 
                            onClick={() => handleOpenDeleteModal(category)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Ẩn danh mục"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenDeleteModal(category)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Hiện danh mục"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentCategory ? "Edit Category" : "Add New Category"}
            </h2>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="e.g. Cloud Hosting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                <input 
                  type="text" 
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="e.g. cloud-hosting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none h-24"
                  placeholder="Category description..."
                />
              </div>
              
              {currentCategory && (
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="catIsActive" 
                    checked={formData.isActive} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500 focus:ring-2" 
                  />
                  <label htmlFor="catIsActive" className="text-sm font-medium text-gray-300">Hiển thị danh mục</label>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleCloseFormModal}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Hide Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`glassmorphism w-full max-w-md rounded-2xl border shadow-2xl p-6 animate-in fade-in zoom-in duration-200 ${currentCategory?.isActive ? 'border-red-900/50' : 'border-green-900/50'}`}>
            <div className={`flex items-center gap-4 mb-4 ${currentCategory?.isActive ? 'text-red-400' : 'text-green-400'}`}>
              <div className={`p-3 rounded-full ${currentCategory?.isActive ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {currentCategory?.isActive ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{currentCategory?.isActive ? "Ẩn Danh mục?" : "Hiện Danh mục?"}</h2>
            </div>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <div className={`mb-6 p-4 rounded-xl ${currentCategory?.isActive ? 'bg-red-900/20 border border-red-800/30' : 'bg-green-900/20 border border-green-800/30'}`}>
              {currentCategory?.isActive ? (
                <>
                  <p className="text-red-200 font-medium">Hành động này sẽ ẩn toàn bộ gói cước và bảng giá thuộc danh mục này!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Bạn có chắc chắn muốn ẩn danh mục <span className="text-white font-semibold">{currentCategory?.name}</span>?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-green-200 font-medium">Hành động này sẽ hiển thị lại danh mục trên trang chủ!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Bạn có chắc chắn muốn hiển thị lại danh mục <span className="text-white font-semibold">{currentCategory?.name}</span>?
                  </p>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors shadow-lg ${currentCategory?.isActive ? 'bg-red-600 hover:bg-red-500 shadow-red-950/30' : 'bg-green-600 hover:bg-green-500 shadow-green-950/30'}`}
              >
                {isSubmitting ? (currentCategory?.isActive ? "Đang ẩn..." : "Đang hiện...") : (currentCategory?.isActive ? "Đồng ý Ẩn" : "Đồng ý Hiện")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
