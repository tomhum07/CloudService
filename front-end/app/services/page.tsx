"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

function getCategoryIcon(name: string = ""): string {
  const lower = name.toLowerCase();
  if (lower.includes("vps") || lower.includes("máy chủ")) return "⚡";
  if (lower.includes("host") || lower.includes("web")) return "🌐";
  if (lower.includes("domain") || lower.includes("miền")) return "🏷️";
  if (lower.includes("mail") || lower.includes("thư")) return "✉️";
  if (lower.includes("ssl") || lower.includes("chứng chỉ")) return "🔒";
  if (lower.includes("firewall") || lower.includes("ddos") || lower.includes("bảo mật")) return "🛡️";
  return "📦";
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, planRes] = await Promise.all([
        apiFetch("/api/service-categories?pageSize=50"),
        apiFetch("/api/service-plans?pageSize=100")
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const rawCats = catData.items || catData;
        if (Array.isArray(rawCats)) {
          setCategories(rawCats.filter((c: any) => c.isActive !== false));
        }
      }

      if (planRes.ok) {
        const planData = await planRes.json();
        const rawPlans = planData.items || planData;
        if (Array.isArray(rawPlans)) {
          setPlans(rawPlans.filter((p: any) => p.isActive !== false));
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách dịch vụ từ database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "category" || entity === "plan" || entity === "price" || entity === "all") {
        fetchData();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-3">Dịch Vụ Cốt Lõi Chuẩn Datacenter</span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Giải Pháp Hạ Tầng & Bảo Mật Toàn Diện
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Hệ sinh thái hạ tầng đám mây chuyên nghiệp với dữ liệu thực tế được quản lý trực tiếp trong cơ sở dữ liệu.
          </p>
        </div>

        {/* Categories & Real Plans Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            <span className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block mb-3"></span>
            <div>Đang tải dữ liệu dịch vụ từ cơ sở dữ liệu...</div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có danh mục dịch vụ nào</h3>
            <p className="text-xs text-slate-500">
              Vui lòng truy cập trang quản trị Admin để thêm danh mục và gói dịch vụ vào hệ thống.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categories.map((cat) => {
              const catPlans = plans.filter((p) => p.categoryId === cat.id);

              return (
                <div
                  key={cat.id}
                  id={cat.slug}
                  className="bg-white border border-slate-200 rounded-3xl p-7 flex flex-col justify-between hover:border-blue-400 hover:shadow-xl transition-all duration-300 group shadow-xs"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {catPlans.length} gói cước
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      {cat.description || "Hệ sinh thái hạ tầng đám mây chuyên nghiệp, tốc độ cao và an toàn tuyệt đối."}
                    </p>

                    <div className="h-[1px] bg-slate-100 mb-4"></div>

                    {/* Danh sách các gói cước thật thuộc danh mục */}
                    <div className="space-y-2.5 mb-8">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Các gói cước nổi bật:
                      </span>
                      {catPlans.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Đang cập nhật các gói mới...</p>
                      ) : (
                        catPlans.slice(0, 4).map((p) => {
                          const prices = p.prices || [];
                          const priceNum = prices[0]?.price || 0;
                          const priceStr = priceNum > 0
                            ? new Intl.NumberFormat("vi-VN").format(priceNum) + "đ"
                            : "Liên hệ";

                          return (
                            <Link
                              key={p.id}
                              href={`/order?planId=${p.id}`}
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 transition-colors flex items-center justify-between group/item block"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors truncate">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {p.cpu && `${p.cpu} • `}{p.ram && `${p.ram} • `}{p.storage || ""}
                                </div>
                              </div>
                              <span className="text-xs font-black text-blue-600 shrink-0">
                                {priceStr}
                              </span>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/pricing`}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-md shadow-blue-500/20"
                  >
                    Xem Bảng Giá & Đăng Ký →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Technical Architecture Strip */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn Cần Tư Vấn Thiết Kế Giải Pháp Riêng Biệt?</h3>
          <p className="text-xs text-slate-500 max-w-xl mx-auto mb-6">
            Đội ngũ kỹ sư giải pháp của CloudService sẵn sàng hỗ trợ tư vấn cấu hình tối ưu nhất cho website và ứng dụng của bạn 24/7.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
            >
              Bảng Báo Giá Chi Tiết
            </Link>
            <Link
              href="/order"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Liên Hệ Đặt Dịch Vụ
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
