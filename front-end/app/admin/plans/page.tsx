"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface Category {
  id: string | number;
  name: string;
}

interface ServicePlan {
  id: string | number;
  name: string;
  description: string;
  categoryId: number;
  category?: Category;
  cpu: string;
  ram: string;
  storage: string;
  bandwidth: string;
  qrCodeUrl: string | null;
  isActive: boolean;
  price?: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalItems = plans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const [error, setError] = useState<string | null>(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ServicePlan | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "" as string | number,
    description: "",
    cpu: "",
    ram: "",
    storage: "",
    bandwidth: "",
    isActive: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [searchTerm, filterCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await apiFetch("/api/service-categories?includeInactive=true&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items)) {
          setCategories(items);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy danh mục", err);
    }
  };

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("pageSize", "100");
      if (searchTerm) queryParams.append("search", searchTerm);
      if (filterCategory) queryParams.append("categoryId", filterCategory);
      if (sortBy) queryParams.append("sort", sortBy);
      queryParams.append("includeInactive", "true");
      
      const res = await apiFetch(`/api/service-plans?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Không thể tải danh sách gói cước.");
      const data = await res.json();
      setPlans(data.items || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải gói cước.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (plan?: ServicePlan) => {
    setFormError(null);
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        name: plan.name,
        categoryId: plan.categoryId,
        description: plan.description || "",
        cpu: plan.cpu || "",
        ram: plan.ram || "",
        storage: plan.storage || "",
        bandwidth: plan.bandwidth || "",
        isActive: plan.isActive !== false
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        name: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        description: "",
        cpu: "",
        ram: "",
        storage: "",
        bandwidth: "",
        isActive: true
      });
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentPlan(null);
  };

  const handleOpenDeleteModal = (plan: ServicePlan) => {
    setFormError(null);
    setCurrentPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentPlan(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const method = currentPlan ? "PUT" : "POST";
      const endpoint = currentPlan 
        ? `/api/service-plans/${currentPlan.id}` 
        : "/api/service-plans";

      const payload = {
        name: formData.name,
        categoryId: Number(formData.categoryId),
        description: formData.description || "",
        cpu: formData.cpu || "",
        ram: formData.ram || "",
        storage: formData.storage || "",
        bandwidth: formData.bandwidth || "",
        isActive: formData.isActive
      };

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lưu gói cước thất bại.");
      
      handleCloseFormModal();
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Không thể lưu gói cước.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPlan) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      let res;
      if (currentPlan.isActive !== false) {
        res = await apiFetch(`/api/service-plans/${currentPlan.id}`, {
          method: "DELETE"
        });
      } else {
        res = await apiFetch(`/api/service-plans/${currentPlan.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: currentPlan.name,
            description: currentPlan.description || "",
            cpu: currentPlan.cpu || "",
            ram: currentPlan.ram || "",
            storage: currentPlan.storage || "",
            bandwidth: currentPlan.bandwidth || "",
            isActive: true
          })
        });
      }
      if (!res.ok) throw new Error(currentPlan.isActive !== false ? "Ẩn gói cước thất bại." : "Hiện gói cước thất bại.");
      
      handleCloseDeleteModal();
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Lỗi thay đổi trạng thái gói cước.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateQR = async (id: string | number) => {
    try {
      const res = await apiFetch(`/api/service-plans/${id}/qr-code/regenerate`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Tạo lại mã QR thất bại.");
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Lỗi khi sinh lại mã QR.");
    }
  };

  const getCategoryName = (categoryId: number, categoryObj?: Category) => {
    if (categoryObj?.name) return categoryObj.name;
    const cat = categories.find(c => Number(c.id) === Number(categoryId));
    return cat ? cat.name : "Chưa phân loại";
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Quản Lý Gói Cước Dịch Vụ</h1>
          <p className="text-xs text-slate-500 mt-1">Cấu hình CPU, RAM, Ổ cứng NVMe, Băng thông mạng và Mã QR thanh toán</p>
        </div>
        <button 
          onClick={() => handleOpenFormModal()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <span>➕</span>
          <span>Thêm Gói Cước Mới</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên gói cước..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
        <div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="">Tất Cả Danh Mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="name_asc">Tên (A-Z)</option>
            <option value="name_desc">Tên (Z-A)</option>
            <option value="price_asc">Giá (Thấp đến Cao)</option>
            <option value="price_desc">Giá (Cao đến Thấp)</option>
            <option value="date_desc">Mới nhất trước</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Gói Cước & Danh Mục</th>
                <th className="py-3.5 px-4">Thông Số Phần Cứng</th>
                <th className="py-3.5 px-4">Mã QR Code</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Đang tải danh sách gói cước...</td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Không tìm thấy gói cước nào.</td>
                </tr>
              ) : (
                plans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm mb-1">{plan.name}</div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {getCategoryName(plan.categoryId, plan.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="space-y-1 text-[11px]">
                        <div><strong className="text-blue-600">CPU:</strong> {plan.cpu || "-"}</div>
                        <div><strong className="text-blue-600">RAM:</strong> {plan.ram || "-"} | <strong className="text-blue-600">Ổ cứng:</strong> {plan.storage || "-"}</div>
                        <div><strong className="text-blue-600">Băng thông:</strong> {plan.bandwidth || "-"}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {plan.qrCodeUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={plan.qrCodeUrl} alt="QR Code" className="w-10 h-10 border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs" />
                          <button
                            onClick={() => handleRegenerateQR(plan.id)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                            title="Tạo lại mã QR"
                          >
                            🔄 Tạo lại
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegenerateQR(plan.id)}
                          className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200"
                        >
                          Sinh mã QR
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {plan.isActive !== false ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Đang bán
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Đang ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button 
                        onClick={() => handleOpenFormModal(plan)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(plan)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          plan.isActive !== false
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {plan.isActive !== false ? "Ẩn" : "Hiện"}
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
              Trang {currentPage} / {totalPages} ({totalItems} gói cước)
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
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentPlan ? "Chỉnh Sửa Gói Cước" : "Thêm Gói Cước Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cấu hình thông số kỹ thuật và liên kết danh mục.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên Gói Cước *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cloud VPS Pro 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Danh Mục Dịch Vụ *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vi Xử Lý (CPU)</label>
                  <input
                    type="text"
                    placeholder="VD: 2 vCPUs AMD EPYC"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bộ Nhớ RAM</label>
                  <input
                    type="text"
                    placeholder="VD: 4 GB RAM ECC"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dung Lượng Ổ Cứng</label>
                  <input
                    type="text"
                    placeholder="VD: 60 GB Enterprise NVMe"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Băng Thông Mạng</label>
                  <input
                    type="text"
                    placeholder="VD: 1 Gbps Không giới hạn"
                    value={formData.bandwidth}
                    onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô Tả Chi Tiết Gói</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các tính năng đi kèm (Bảo vệ Anti-DDoS, Backup tự động...)"
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
                  {isSubmitting ? "Đang lưu..." : "Lưu Gói Cước"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Toggle Modal */}
      {isDeleteModalOpen && currentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="text-3xl mb-3">{currentPlan.isActive !== false ? "👁️‍🗨️" : "👁️"}</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentPlan.isActive !== false ? "Ẩn Gói Cước Này?" : "Kích Hoạt Lại Gói Cước?"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc muốn {currentPlan.isActive !== false ? "ẩn" : "kích hoạt lại"} gói <strong>{currentPlan.name}</strong> ngoài trang bán hàng?
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
                  currentPlan.isActive !== false ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? "Đang xử lý..." : currentPlan.isActive !== false ? "Xác Nhận Ẩn" : "Xác Nhận Hiện"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
