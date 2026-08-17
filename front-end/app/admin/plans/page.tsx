"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface Category {
  id: string;
  name: string;
}

interface ServicePlan {
  id: string;
  name: string;
  description: string;
  categoryId: string;
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
  const itemsPerPage = 5;
  const totalItems = plans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const [error, setError] = useState<string | null>(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ServicePlan | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
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
      const res = await apiFetch("/api/service-categories?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append("search", searchTerm);
      if (filterCategory) queryParams.append("categoryId", filterCategory);
      if (sortBy) queryParams.append("sortBy", sortBy);
      queryParams.append("includeInactive", "true");
      
      const res = await apiFetch(`/api/service-plans?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch service plans");
      const data = await res.json();
      setPlans(data.items || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data.");
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

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed to save service plan");
      
      handleCloseFormModal();
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Failed to save service plan.");
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
        // Ẩn gói cước
        res = await apiFetch(`/api/service-plans/${currentPlan.id}`, {
          method: "DELETE"
        });
      } else {
        // Hiện gói cước (PUT)
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
      if (!res.ok) throw new Error(currentPlan.isActive !== false ? "Ẩn gói cước thất bại" : "Kích hoạt lại gói cước thất bại");
      
      handleCloseDeleteModal();
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Failed to toggle service plan visibility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateQR = async (id: string) => {
    try {
      const res = await apiFetch(`/api/service-plans/${id}/qr-code/regenerate`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to regenerate QR code");
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Failed to regenerate QR code.");
    }
  };

  const getCategoryName = (categoryId: string, categoryObj?: Category) => {
    if (categoryObj?.name) return categoryObj.name;
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "Unknown Category";
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">Service Plans</h1>
          <p className="text-gray-400">Manage your hosting and service plans</p>
        </div>
        <button 
          onClick={() => handleOpenFormModal()}
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Search plans..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="">Default Sort</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="date_asc">Date (Oldest first)</option>
            <option value="date_desc">Date (Newest first)</option>
          </select>
        </div>
      </div>

      <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-800 text-gray-300">
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Plan Details</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Specs</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">QR Code</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider">Status</th>
                <th className="p-5 font-semibold text-sm uppercase tracking-wider text-right">Actions</th>
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
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No service plans found.</td>
                </tr>
              ) : (
                plans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="p-5">
                      <div className="font-medium text-gray-200">{plan.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{getCategoryName(plan.categoryId, plan.category)}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">CPU: {plan.cpu}</span>
                        <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">RAM: {plan.ram}</span>
                        <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">Storage: {plan.storage}</span>
                        <span className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">BW: {plan.bandwidth}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {plan.qrCodeUrl ? (
                          <div className="relative group/qr cursor-pointer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={plan.qrCodeUrl} alt="QR Code" className="w-10 h-10 rounded border border-gray-600 bg-white" />
                            <div className="absolute top-0 left-12 hidden group-hover/qr:block z-10 bg-white p-2 rounded shadow-xl border border-gray-200">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={plan.qrCodeUrl} alt="QR Code Large" className="w-40 h-40" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No QR</span>
                        )}
                        <button 
                          onClick={() => handleRegenerateQR(plan.id)}
                          className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded transition-colors"
                          title="Regenerate QR"
                        >
                          Regen
                        </button>
                      </div>
                    </td>
                    <td className="p-5">
                      {plan.isActive !== false ? (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-green-950/30 text-green-400 border border-green-800/50 font-medium">Đang hiện</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-red-950/30 text-red-400 border border-red-800/50 font-medium">Đang ẩn</span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenFormModal(plan)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        {plan.isActive !== false ? (
                          <button 
                            onClick={() => handleOpenDeleteModal(plan)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Ẩn gói cước"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenDeleteModal(plan)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Hiện gói cước"
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
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-800 text-gray-400 text-xs sm:text-sm bg-gray-900/10">
              <div>
                Hiển thị <span className="text-white font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> đến <span className="text-white font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong số <span className="text-white font-medium">{totalItems}</span> gói cước
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-medium transition-colors"
                >
                  Đầu
                </button>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-medium transition-colors"
                >
                  Trước
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-white font-semibold">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-medium transition-colors"
                >
                  Sau
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 text-white font-medium transition-colors"
                >
                  Cuối
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glassmorphism w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl p-6 my-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentPlan ? "Edit Service Plan" : "Add New Service Plan"}
            </h2>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="e.g. Basic Hosting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select 
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-20"
                  placeholder="Plan description..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CPU</label>
                  <input 
                    type="text" 
                    value={formData.cpu}
                    onChange={(e) => setFormData({...formData, cpu: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="1 Core"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">RAM</label>
                  <input 
                    type="text" 
                    value={formData.ram}
                    onChange={(e) => setFormData({...formData, ram: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="2 GB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Storage</label>
                  <input 
                    type="text" 
                    value={formData.storage}
                    onChange={(e) => setFormData({...formData, storage: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="20 GB NVMe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bandwidth</label>
                  <input 
                    type="text" 
                    value={formData.bandwidth}
                    onChange={(e) => setFormData({...formData, bandwidth: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="1 TB"
                  />
                </div>
              </div>
              
              {currentPlan && (
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="planIsActive" 
                    checked={formData.isActive} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500 focus:ring-2" 
                  />
                  <label htmlFor="planIsActive" className="text-sm font-medium text-gray-300">Hiển thị gói cước</label>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 mt-6">
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
                  {isSubmitting ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Hide Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`glassmorphism w-full max-w-md rounded-2xl border shadow-2xl p-6 animate-in fade-in zoom-in duration-200 ${currentPlan?.isActive !== false ? 'border-red-900/50' : 'border-green-900/50'}`}>
            <div className={`flex items-center gap-4 mb-4 ${currentPlan?.isActive !== false ? 'text-red-400' : 'text-green-400'}`}>
              <div className={`p-3 rounded-full ${currentPlan?.isActive !== false ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {currentPlan?.isActive !== false ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{currentPlan?.isActive !== false ? "Ẩn Gói cước?" : "Hiện Gói cước?"}</h2>
            </div>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <div className={`mb-6 p-4 rounded-xl ${currentPlan?.isActive !== false ? 'bg-red-900/20 border border-red-800/30' : 'bg-green-900/20 border border-green-800/30'}`}>
              {currentPlan?.isActive !== false ? (
                <>
                  <p className="text-red-200 font-medium">Cảnh báo: Hành động này sẽ đồng thời ẩn toàn bộ bảng giá của gói cước này!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Bạn có chắc chắn muốn ẩn gói cước <span className="text-white font-semibold">{currentPlan?.name}</span>?
                  </p>
                </>
              ) : (
                <>
                  <p className="text-green-200 font-medium">Hành động này sẽ hiển thị lại gói cước này trên trang dịch vụ!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Bạn có chắc chắn muốn hiển thị lại gói cước <span className="text-white font-semibold">{currentPlan?.name}</span>?
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
                className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors shadow-lg ${currentPlan?.isActive !== false ? 'bg-red-600 hover:bg-red-500 shadow-red-950/30' : 'bg-green-600 hover:bg-green-500 shadow-green-950/30'}`}
              >
                {isSubmitting ? (currentPlan?.isActive !== false ? "Đang ẩn..." : "Đang hiện...") : (currentPlan?.isActive !== false ? "Đồng ý Ẩn" : "Đồng ý Hiện")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
