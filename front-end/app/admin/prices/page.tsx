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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPriceItems = prices.length;
  const totalPricePages = Math.ceil(totalPriceItems / itemsPerPage) || 1;

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
      const res = await apiFetch("/api/service-plans?includeInactive=true&pageSize=200");
      if (res.ok) {
        const data = await res.json();
        const planList = data.items || data;
        if (Array.isArray(planList)) {
          setPlans(planList);
          if (planList.length > 0) {
            setSelectedPlanId(planList[0].id.toString());
          }
        }
      } else {
        throw new Error("Không thể tải danh sách gói cước");
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
      const res = await apiFetch(`/api/service-plans/${planId}/prices?includeInactive=true`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingPrices(false);
    }
  };

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

  const handleClosePriceModal = () => {
    setIsPriceModalOpen(false);
    setCurrentPrice(null);
  };

  const handleOpenDeletePriceModal = (price: PlanPrice) => {
    setFormError(null);
    setCurrentPrice(price);
    setIsDeletePriceModalOpen(true);
  };

  const handleCloseDeletePriceModal = () => {
    setIsDeletePriceModalOpen(false);
    setCurrentPrice(null);
  };

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

      const payload: any = {
        billingCycle: priceForm.billingCycle,
        price: Number(priceForm.price),
        isActive: priceForm.isActive
      };
      if (priceForm.promotionId) {
        payload.promotionId = Number(priceForm.promotionId);
      }

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lưu bảng giá thất bại.");

      handleClosePriceModal();
      fetchPrices(selectedPlanId);
    } catch (err: any) {
      setFormError(err.message || "Không thể lưu giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrice = async () => {
    if (!currentPrice || !selectedPlanId) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      let res;
      if (currentPrice.isActive) {
        res = await apiFetch(`/api/service-plans/${selectedPlanId}/prices/${currentPrice.id}`, {
          method: "DELETE"
        });
      } else {
        res = await apiFetch(`/api/service-plans/${selectedPlanId}/prices/${currentPrice.id}`, {
          method: "PUT",
          body: JSON.stringify({
            billingCycle: currentPrice.billingCycle,
            price: currentPrice.price,
            promotionId: currentPrice.promotionId,
            isActive: true
          })
        });
      }

      if (!res.ok) throw new Error(currentPrice.isActive ? "Vô hiệu hóa giá thất bại." : "Kích hoạt giá thất bại.");

      handleCloseDeletePriceModal();
      fetchPrices(selectedPlanId);
    } catch (err: any) {
      setFormError(err.message || "Lỗi thay đổi trạng thái giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPromoModal = () => {
    setFormError(null);
    setPromoForm({ name: "", discountPercentage: 0, startDate: "", endDate: "" });
    setIsPromoModalOpen(true);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await apiFetch("/api/promotions", {
        method: "POST",
        body: JSON.stringify({
          name: promoForm.name,
          discountPercentage: Number(promoForm.discountPercentage),
          startDate: promoForm.startDate ? new Date(promoForm.startDate).toISOString() : new Date().toISOString(),
          endDate: promoForm.endDate ? new Date(promoForm.endDate).toISOString() : new Date(Date.now() + 30*86400000).toISOString()
        })
      });

      if (!res.ok) throw new Error("Tạo mã khuyến mãi thất bại.");

      setIsPromoModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      setFormError(err.message || "Không thể tạo khuyến mãi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle.toLowerCase()) {
      case "monthly": return "1 Tháng";
      case "quarterly": return "3 Tháng";
      case "semiannually": return "6 Tháng";
      case "yearly": return "12 Tháng (1 Năm)";
      case "biennially": return "24 Tháng (2 Năm)";
      default: return cycle;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">Quản Lý Bảng Giá & Khuyến Mãi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Cấu hình giá cước theo từng chu kỳ thanh toán và gắn chương trình ưu đãi giảm giá</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenPromoModal}
            className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Tạo Khuyến Mãi</span>
          </button>
          <button 
            onClick={() => handleOpenPriceModal()}
            disabled={!selectedPlanId}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm Mức Giá</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Plan Selector Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <label className="text-xs font-bold text-slate-800 shrink-0">Chọn Gói Cước Cần Định Giá:</label>
        <select 
          value={selectedPlanId} 
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="w-full md:w-80 h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
        >
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Prices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Chu Kỳ Thanh Toán</th>
                <th className="py-3.5 px-4">Giá Niêm Yết (VND)</th>
                <th className="py-3.5 px-4">Khuyến Mãi Kèm Theo</th>
                <th className="py-3.5 px-4">Giá Sau Giảm</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingPrices ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Đang tải bảng giá...</td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Gói cước này chưa được thiết lập mức giá nào.</td>
                </tr>
              ) : (
                prices.map((p) => {
                  const finalPrice = p.discountPercentage
                    ? p.price * (1 - p.discountPercentage / 100)
                    : p.price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {getCycleLabel(p.billingCycle)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.price.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3.5 px-4">
                        {p.promotionName ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            {p.promotionName} (-{p.discountPercentage}%)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Không áp dụng</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {Math.round(finalPrice).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Khả dụng
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Đã tắt
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenPriceModal(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleOpenDeletePriceModal(p)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                            p.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.isActive ? "Tắt" : "Bật"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Form Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentPrice ? "Chỉnh Sửa Mức Giá" : "Thêm Mức Giá Mới"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cấu hình chu kỳ và số tiền thanh toán.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Chu Kỳ Thanh Toán *</label>
                <select
                  value={priceForm.billingCycle}
                  onChange={(e) => setPriceForm({ ...priceForm, billingCycle: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="Monthly">1 Tháng (Monthly)</option>
                  <option value="Quarterly">3 Tháng (Quarterly)</option>
                  <option value="SemiAnnually">6 Tháng (SemiAnnually)</option>
                  <option value="Yearly">12 Tháng (Yearly)</option>
                  <option value="Biennially">24 Tháng (Biennially)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Giá Tiền (VND) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="VD: 150000"
                  value={priceForm.price === 0 ? "" : priceForm.price}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    setPriceForm({ ...priceForm, price: val });
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Chương Trình Khuyến Mãi (Nếu có)</label>
                <select
                  value={priceForm.promotionId}
                  onChange={(e) => setPriceForm({ ...priceForm, promotionId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="">-- Không áp dụng khuyến mãi --</option>
                  {promotions.map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.name} (Giảm {pr.discountPercentage}%)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClosePriceModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu Bảng Giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Price Modal */}
      {isDeletePriceModalOpen && currentPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {currentPrice.isActive ? "Tắt Mức Giá Này?" : "Bật Lại Mức Giá Này?"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc muốn thay đổi trạng thái áp dụng cho chu kỳ <strong>{getCycleLabel(currentPrice.billingCycle)}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCloseDeletePriceModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeletePrice}
                disabled={isSubmitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm ${
                  currentPrice.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? "Đang xử lý..." : currentPrice.isActive ? "Xác Nhận Tắt" : "Xác Nhận Bật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Form Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tạo Chương Trình Khuyến Mãi Mới</h3>
            <p className="text-xs text-slate-500 mb-4">Mã giảm giá sẽ tự động trừ % khi khách hàng chọn gói cước.</p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên Chương Trình *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Khuyến Mãi Mùa Hè 2026"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phần Trăm Giảm Giá (%) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="VD: 20"
                  value={promoForm.discountPercentage === 0 ? "" : promoForm.discountPercentage}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                    setPromoForm({ ...promoForm, discountPercentage: val });
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo Khuyến Mãi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
