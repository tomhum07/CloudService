"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

interface ServicePlan {
  id: string | number;
  name: string;
}

interface PlanPrice {
  id: number;
  planId: number;
  billingCycle: string;
  price: number;
  promotionId?: number | null;
  promotionName?: string | null;
  discountPercentage?: number | null;
  isActive: boolean;
}

interface Promotion {
  id: number;
  name: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function PricesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isDeletePriceModalOpen, setIsDeletePriceModalOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<PlanPrice | null>(null);

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Forms state
  const [priceForm, setPriceForm] = useState({
    billingCycle: "Monthly",
    price: 0,
    promotionId: "" as string | number,
    isActive: true
  });

  const [promoForm, setPromoForm] = useState({
    name: "",
    discountPercentage: 0,
    startDate: "",
    endDate: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPrices(selectedPlanId);
    } else {
      setPrices([]);
    }
  }, [selectedPlanId]);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await apiFetch("/api/service-plans");
      if (res.ok) {
        const data = await res.json();
        const planList = data.items || [];
        setPlans(planList);
        if (planList.length > 0) {
          setSelectedPlanId(planList[0].id.toString());
        }
      } else {
        throw new Error("Failed to load plans");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchPromotions = async () => {
    setIsLoadingPromotions(true);
    try {
      const res = await apiFetch("/api/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data);
      } else {
        throw new Error("Failed to load promotions");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  const fetchPrices = async (planId: string) => {
    setIsLoadingPrices(true);
    try {
      const res = await apiFetch(`/api/service-plans/${planId}/prices`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      } else {
        throw new Error("Failed to load prices for the selected plan");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Price Modal Handlers
  const handleOpenPriceModal = (price?: PlanPrice) => {
    setFormError(null);
    if (price) {
      setCurrentPrice(price);
      setPriceForm({
        billingCycle: price.billingCycle,
        price: price.price,
        promotionId: price.promotionId || "",
        isActive: price.isActive
      });
    } else {
      setCurrentPrice(null);
      setPriceForm({
        billingCycle: "Monthly",
        price: 0,
        promotionId: "",
        isActive: true
      });
    }
    setIsPriceModalOpen(true);
  };

  const handleClosePriceModal = () => setIsPriceModalOpen(false);

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const method = currentPrice ? "PUT" : "POST";
      const endpoint = currentPrice 
        ? `/api/service-plans/${selectedPlanId}/prices/${currentPrice.id}` 
        : `/api/service-plans/${selectedPlanId}/prices`;

      const payload = {
        billingCycle: priceForm.billingCycle,
        price: Number(priceForm.price),
        promotionId: priceForm.promotionId ? Number(priceForm.promotionId) : null,
        isActive: priceForm.isActive
      };

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save price");
      
      handleClosePriceModal();
      fetchPrices(selectedPlanId);
    } catch (err: any) {
      setFormError(err.message || "Failed to save price.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeletePrice = (price: PlanPrice) => {
    setCurrentPrice(price);
    setIsDeletePriceModalOpen(true);
  };

  const handleDeletePrice = async () => {
    if (!currentPrice || !selectedPlanId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      let res;
      if (currentPrice.isActive) {
        // Ẩn bảng giá
        res = await apiFetch(`/api/service-plans/${selectedPlanId}/prices/${currentPrice.id}`, {
          method: "DELETE"
        });
      } else {
        // Hiện bảng giá (PUT)
        res = await apiFetch(`/api/service-plans/${selectedPlanId}/prices/${currentPrice.id}`, {
          method: "PUT",
          body: JSON.stringify({
            billingCycle: currentPrice.billingCycle,
            price: Number(currentPrice.price),
            promotionId: currentPrice.promotionId ? Number(currentPrice.promotionId) : null,
            isActive: true
          })
        });
      }
      if (!res.ok) throw new Error(currentPrice.isActive ? "Ẩn bảng giá thất bại" : "Kích hoạt lại bảng giá thất bại");
      
      setIsDeletePriceModalOpen(false);
      fetchPrices(selectedPlanId);
    } catch (err: any) {
      setFormError(err.message || "Failed to toggle price visibility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Promo Modal Handlers
  const handleOpenPromoModal = () => {
    setFormError(null);
    setPromoForm({
      name: "",
      discountPercentage: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
    });
    setIsPromoModalOpen(true);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: promoForm.name,
        discountPercentage: Number(promoForm.discountPercentage),
        startDate: new Date(promoForm.startDate).toISOString(),
        endDate: new Date(promoForm.endDate).toISOString()
      };

      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create promotion");
      
      setIsPromoModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      setFormError(err.message || "Failed to create promotion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Pricing & Promotions
        </h1>
        <p className="text-gray-400">Manage pricing models and promotional campaigns</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Plan Selector */}
      <div className="mb-8 glassmorphism p-6 rounded-2xl border border-gray-800 shadow-xl">
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Service Plan</label>
        {isLoadingPlans ? (
          <div className="h-12 w-full bg-gray-800 animate-pulse rounded-xl"></div>
        ) : (
          <select 
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full max-w-md bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Prices */}
        <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h2 className="text-xl font-semibold text-white">Plan Prices</h2>
            <button 
              onClick={() => handleOpenPriceModal()}
              disabled={!selectedPlanId}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Price
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Chu kỳ thanh toán</th>
                  <th className="p-4 font-semibold">Giá niêm yết</th>
                  <th className="p-4 font-semibold">Khuyến mãi</th>
                  <th className="p-4 font-semibold">Giá thực tế</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                  <th className="p-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {isLoadingPrices ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Đang tải bảng giá...</td>
                  </tr>
                ) : prices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Chưa có bảng giá nào cho gói cước này.</td>
                  </tr>
                ) : (
                  prices.map(price => {
                    const finalPrice = price.discountPercentage 
                      ? price.price * (1 - price.discountPercentage / 100)
                      : price.price;
                    
                    return (
                      <tr key={price.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="p-4 text-white font-medium">{price.billingCycle}</td>
                        <td className="p-4 text-gray-300">{formatCurrency(price.price)}</td>
                        <td className="p-4">
                          {price.promotionName ? (
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs">
                              {price.promotionName} (-{price.discountPercentage}%)
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-4 text-green-400 font-semibold">{formatCurrency(finalPrice)}</td>
                        <td className="p-4">
                          {price.isActive !== false ? (
                            <span className="px-2.5 py-1 text-xs rounded-md bg-green-950/30 text-green-400 border border-green-800/50 font-medium">Đang hiện</span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs rounded-md bg-red-950/30 text-red-400 border border-red-800/50 font-medium">Đang ẩn</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenPriceModal(price)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            {price.isActive !== false ? (
                              <button 
                                onClick={() => handleOpenDeletePrice(price)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Ẩn bảng giá"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                </svg>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleOpenDeletePrice(price)}
                                className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                                title="Hiện bảng giá"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Promotions */}
        <div className="glassmorphism rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h2 className="text-xl font-semibold text-white">Promotions</h2>
            <button 
              onClick={handleOpenPromoModal}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all shadow-[0_0_10px_rgba(147,51,234,0.3)] flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Promo
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Discount</th>
                  <th className="p-4 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {isLoadingPromotions ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Loading promotions...</td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">No promotions available.</td>
                  </tr>
                ) : (
                  promotions.map(promo => (
                    <tr key={promo.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-white font-medium">
                        {promo.name}
                        {!promo.isActive && <span className="ml-2 text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded">Inactive</span>}
                      </td>
                      <td className="p-4 text-purple-400 font-bold">{promo.discountPercentage}%</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Price Form Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentPrice ? "Edit Plan Price" : "Add Plan Price"}
            </h2>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Billing Cycle</label>
                <input 
                  type="text" 
                  required
                  value={priceForm.billingCycle}
                  onChange={(e) => setPriceForm({...priceForm, billingCycle: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. Monthly, Yearly"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price (VND)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="1000"
                  value={priceForm.price}
                  onChange={(e) => setPriceForm({...priceForm, price: Number(e.target.value)})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Applied Promotion</label>
                <select 
                  value={priceForm.promotionId}
                  onChange={(e) => setPriceForm({...priceForm, promotionId: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                  <option value="">None</option>
                  {promotions.map(promo => (
                    <option key={promo.id} value={promo.id}>{promo.name} (-{promo.discountPercentage}%)</option>
                  ))}
                </select>
              </div>

              {currentPrice && (
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="priceIsActive" 
                    checked={priceForm.isActive} 
                    onChange={(e) => setPriceForm({...priceForm, isActive: e.target.checked})} 
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500 focus:ring-2" 
                  />
                  <label htmlFor="priceIsActive" className="text-sm font-medium text-gray-300">Hiển thị bảng giá</label>
                </div>
              )}

              <div className="flex gap-3 pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={handleClosePriceModal}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  {isSubmitting ? "Saving..." : "Save Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Price Confirmation Modal */}
      {isDeletePriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`glassmorphism w-full max-w-md rounded-2xl border shadow-2xl p-6 animate-in fade-in zoom-in duration-200 ${currentPrice?.isActive ? 'border-red-900/50' : 'border-green-900/50'}`}>
            <div className={`flex items-center gap-4 mb-4 ${currentPrice?.isActive ? 'text-red-400' : 'text-green-400'}`}>
              <div className={`p-3 rounded-full ${currentPrice?.isActive ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {currentPrice?.isActive ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">{currentPrice?.isActive ? "Ẩn Bảng giá?" : "Hiện Bảng giá?"}</h2>
            </div>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <p className="text-gray-300 mb-6">
              {currentPrice?.isActive ? (
                `Bạn có chắc chắn muốn ẩn bảng giá chu kỳ ${currentPrice?.billingCycle} này?`
              ) : (
                `Bạn có chắc chắn muốn hiển thị lại bảng giá chu kỳ ${currentPrice?.billingCycle} này?`
              )}
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsDeletePriceModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleDeletePrice}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors shadow-lg ${currentPrice?.isActive ? 'bg-red-600 hover:bg-red-500 shadow-red-950/30' : 'bg-green-600 hover:bg-green-500 shadow-green-950/30'}`}
              >
                {isSubmitting ? (currentPrice?.isActive ? "Đang ẩn..." : "Đang hiện...") : (currentPrice?.isActive ? "Đồng ý Ẩn" : "Đồng ý Hiện")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Form Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism w-full max-w-md rounded-2xl border border-purple-900/30 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create Promotion
            </h2>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Promotion Name</label>
                <input 
                  type="text" 
                  required
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({...promoForm, name: e.target.value})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Discount Percentage (%)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={promoForm.discountPercentage}
                  onChange={(e) => setPromoForm({...promoForm, discountPercentage: Number(e.target.value)})}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={promoForm.startDate}
                    onChange={(e) => setPromoForm({...promoForm, startDate: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={promoForm.endDate}
                    onChange={(e) => setPromoForm({...promoForm, endDate: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsPromoModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-medium transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                >
                  {isSubmitting ? "Creating..." : "Create Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
