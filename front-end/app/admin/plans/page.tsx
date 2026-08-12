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
    bandwidth: ""
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
      const res = await apiFetch("/api/service-categories");
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
      
      const res = await apiFetch(`/api/service-plans?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch service plans");
      const data = await res.json();
      setPlans(data);
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
        bandwidth: plan.bandwidth || ""
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
        bandwidth: ""
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
      const res = await apiFetch(`/api/service-plans/${currentPlan.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete service plan");
      
      handleCloseDeleteModal();
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Failed to delete service plan.");
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
                plans.map((plan) => (
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${plan.isActive !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {plan.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenFormModal(plan)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(plan)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-red-900/50 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Delete Plan?</h2>
            </div>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <div className="mb-6 bg-red-900/20 border border-red-800/30 p-4 rounded-xl">
              <p className="text-red-200 font-medium">Warning: This will cascade soft-delete all plan prices associated with this plan.</p>
              <p className="text-gray-400 text-sm mt-2">
                Are you sure you want to delete <span className="text-white font-semibold">{currentPlan?.name}</span>?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
