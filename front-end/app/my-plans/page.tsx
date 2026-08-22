"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, getAccessToken, refreshAccessToken } from "@/utils/api";
import { dataSyncService } from "@/utils/signalr";

export default function MyPlansPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State cho Modal Thanh Toán QR
  const [selectedPayOrder, setSelectedPayOrder] = useState<any | null>(null);
  const [payosData, setPayosData] = useState<any | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [modalTimeLeft, setModalTimeLeft] = useState<number>(0);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkMessage, setCheckMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    loadMyOrders();

    // Lắng nghe SignalR để cập nhật trạng thái đơn hàng tức thì khi được duyệt hoặc thanh toán
    const unsubscribe = dataSyncService.subscribe((entity) => {
      if (entity === "order" || entity === "all") {
        loadMyOrders();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadMyOrders = async () => {
    setLoading(true);
    let token = getAccessToken();
    if (!token) {
      const ok = await refreshAccessToken();
      if (ok) token = getAccessToken();
    }

    if (token) {
      try {
        const payloadPart = token.split(".")[1];
        if (payloadPart) {
          const payload = JSON.parse(window.atob(payloadPart));
          const username = payload["sub"] || payload["name"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
          setUser({ username });
        }
      } catch (e) {
        console.error("Lỗi giải mã token:", e);
      }
    }

    try {
      const res = await apiFetch("/api/order-requests/my-orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.warn("Lỗi tải đơn hàng của tôi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thời gian hết hạn 30 phút từ lúc tạo đơn
  const getOrderExpiryInfo = (order: any) => {
    if (order.status === 2 || order.status === 3) {
      return { isExpired: order.status === 3, remainingSeconds: 0, formattedTime: "" };
    }
    const createdTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const elapsedMs = now - createdTime;
    const totalLimitMs = 30 * 60 * 1000; // 30 phút
    const remainingMs = totalLimitMs - elapsedMs;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const isExpired = remainingSeconds <= 0;

    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const formattedTime = `${mins}:${secs.toString().padStart(2, "0")}`;

    return { isExpired, remainingSeconds, formattedTime };
  };

  // Mở modal thanh toán QR cho đơn hàng cụ thể & gọi API PayOS thật
  const handleOpenQrModal = async (order: any) => {
    const { isExpired, remainingSeconds } = getOrderExpiryInfo(order);
    if (isExpired) return;

    setSelectedPayOrder(order);
    setPayosData(null);
    setLoadingQr(true);
    setModalTimeLeft(remainingSeconds);
    setCheckMessage(null);
    setPaymentSuccess(false);

    try {
      const payRes = await apiFetch("/api/payment/create-link", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(order.price || order.totalAmount || 0),
          returnUrl: `${window.location.origin}/my-plans`,
          cancelUrl: `${window.location.origin}/pricing`
        })
      });

      if (payRes.ok) {
        const data = await payRes.json();
        setPayosData(data);
      } else {
        const errData = await payRes.json().catch(() => ({}));
        console.warn("PayOS Create Link Notice:", errData);
      }
    } catch (err) {
      console.warn("PayOS Create Link Error:", err);
    } finally {
      setLoadingQr(false);
    }
  };

  // Đồng hồ đếm lùi và polling kiểm tra thanh toán trong Modal
  useEffect(() => {
    if (!selectedPayOrder || paymentSuccess) return;

    const timer = setInterval(() => {
      setModalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tự động cập nhật đơn hàng thành đã hủy do quá 30 phút
          apiFetch(`/api/order-requests/${selectedPayOrder.id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: 3, notes: "Hệ thống: Tự động hủy đơn do quá hạn thanh toán 30 phút" })
          }).catch(() => {});
          loadMyOrders();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling kiểm tra trạng thái đơn hàng và PayOS mỗi 3 giây
    const interval = setInterval(async () => {
      try {
        // 1. Kiểm tra qua PayOS info nếu có orderCode
        if (payosData?.orderCode) {
          const payRes = await apiFetch(`/api/payment/info/${payosData.orderCode}`);
          if (payRes.ok) {
            const payInfo = await payRes.json();
            const st = payInfo.status || (payInfo.data && payInfo.data.status);
            if (st === "PAID" || st === "COMPLETED") {
              setPaymentSuccess(true);
              clearInterval(interval);
              clearInterval(timer);
              // Kích hoạt đơn hàng thành status 2
              apiFetch(`/api/order-requests/${selectedPayOrder.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: 2, notes: `Đã thanh toán thành công qua PayOS [Mã giao dịch: ${payosData.orderCode}]` })
              }).catch(() => {});
              loadMyOrders();
              return;
            }
          }
        }

        // 2. Kiểm tra trực tiếp đơn hàng trong Database
        const res = await apiFetch(`/api/order-requests/${selectedPayOrder.id}`);
        if (res.ok) {
          const freshOrder = await res.json();
          if (freshOrder && freshOrder.status === 2) {
            setPaymentSuccess(true);
            clearInterval(interval);
            clearInterval(timer);
            loadMyOrders();
          }
        }
      } catch (e) {
        console.warn("Polling order error:", e);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, [selectedPayOrder, payosData, paymentSuccess]);

  // Kiểm tra giao dịch thủ công khi người dùng bấm nút
  const handleManualCheckPayment = async () => {
    if (!selectedPayOrder) return;
    setCheckingPayment(true);
    setCheckMessage(null);

    try {
      // 1. Kiểm tra trạng thái qua PayOS nếu có
      if (payosData?.orderCode) {
        const payRes = await apiFetch(`/api/payment/info/${payosData.orderCode}`);
        if (payRes.ok) {
          const payInfo = await payRes.json();
          const st = payInfo.status || (payInfo.data && payInfo.data.status);
          if (st === "PAID" || st === "COMPLETED") {
            setPaymentSuccess(true);
            setCheckMessage({
              type: "success",
              text: "Giao dịch thành công! Dịch vụ của bạn đã được kích hoạt Đang Hoạt Động."
            });
            apiFetch(`/api/order-requests/${selectedPayOrder.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status: 2, notes: `Đã thanh toán thành công qua PayOS [Mã giao dịch: ${payosData.orderCode}]` })
            }).catch(() => {});
            loadMyOrders();
            return;
          }
        }
      }

      // 2. Kiểm tra trạng thái đơn hàng trực tiếp
      const res = await apiFetch(`/api/order-requests/${selectedPayOrder.id}`);
      if (res.ok) {
        const orderData = await res.json();
        if (orderData.status === 2) {
          setPaymentSuccess(true);
          setCheckMessage({
            type: "success",
            text: "Giao dịch thành công! Dịch vụ của bạn đã được kích hoạt Đang Hoạt Động."
          });
          loadMyOrders();
          return;
        }
      }

      // 3. Phản hồi trạng thái
      setCheckMessage({
        type: "info",
        text: "Hệ thống đang đối soát với ngân hàng PayOS. Nếu bạn vừa chuyển khoản, vui lòng chờ trong 5 - 10 giây rồi bấm kiểm tra lại!"
      });
    } catch (err) {
      console.warn("Lỗi kiểm tra thanh toán:", err);
      setCheckMessage({
        type: "error",
        text: "Chưa thể kết nối đến cổng thanh toán PayOS. Vui lòng thử lại sau giây lát."
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const getStatusBadge = (order: any) => {
    const { isExpired, formattedTime } = getOrderExpiryInfo(order);

    if (order.status === 2) {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Đang Hoạt Động
        </span>
      );
    }

    if (order.status === 3 || isExpired) {
      return (
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          Đã Hủy {isExpired && order.status !== 3 ? "(Hết hạn 30p)" : ""}
        </span>
      );
    }

    // Status 0 hoặc 1 trong vòng 30 phút
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs animate-pulse">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        Chờ Kích Hoạt (Thanh Toán) {formattedTime ? `[${formattedTime}]` : ""}
      </span>
    );
  };

  const filteredOrders = orders.filter((o) => {
    const { isExpired } = getOrderExpiryInfo(o);
    const matchSearch =
      o.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchSearch;
    if (statusFilter === "active") return matchSearch && o.status === 2;
    if (statusFilter === "pending") return matchSearch && (o.status === 0 || o.status === 1) && !isExpired;
    if (statusFilter === "cancelled") return matchSearch && (o.status === 3 || isExpired);
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-600 mb-2">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>CỔNG QUẢN LÝ DỊCH VỤ KHÁCH HÀNG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Gói Cước Của Tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi tình trạng máy chủ Cloud VPS, Web Hosting, thanh toán mã QR và quản lý chu kỳ dịch vụ
            </p>
          </div>

          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Đăng Ký Gói Mới</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder="Tìm theo mã đơn (ORD-...), tên gói cước..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang hoạt động</option>
              <option value="pending">🟡 Chờ kích hoạt (Thanh toán)</option>
              <option value="cancelled">🔴 Đã hủy / Hết hạn</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách dịch vụ của bạn...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl mx-auto mb-4 text-blue-600">
              📭
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Chưa Có Gói Dịch Vụ Nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Bạn chưa đăng ký dịch vụ nào hoặc chưa có đơn hàng nào được tạo. Hãy tham khảo bảng giá dịch vụ Cloud VPS & Hosting để trải nghiệm.
            </p>
            <Link
              href="/pricing"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all inline-block"
            >
              Khám Phá Bảng Giá Dịch Vụ →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const { isExpired, formattedTime } = getOrderExpiryInfo(order);
              const isPendingPayment = (order.status === 0 || order.status === 1) && !isExpired;

              return (
                <div
                  key={order.id}
                  className={`bg-white border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-sm ${
                    isPendingPayment
                      ? "border-amber-300 hover:border-amber-400 bg-amber-50/10 ring-1 ring-amber-200"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {order.orderCode}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mt-2">
                          {order.planName}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">{order.categoryName || "Hạ tầng Cloud"}</span>
                      </div>
                      <div>
                        {getStatusBadge(order)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Chu kỳ thanh toán</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {order.billingCycle === "Monthly"
                            ? "1 Tháng (Hàng tháng)"
                            : order.billingCycle === "Quarterly"
                            ? "3 Tháng (Quý)"
                            : order.billingCycle === "SemiAnnual" || order.billingCycle === "HalfYearly"
                            ? "6 Tháng (Bán niên)"
                            : order.billingCycle === "Yearly"
                            ? "12 Tháng (Năm)"
                            : order.billingCycle === "Biennial"
                            ? "24 Tháng (2 Năm)"
                            : order.billingCycle}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Tổng giá trị</span>
                        <span className="font-black text-blue-600 mt-0.5 block">
                          {formatPrice(order.price || order.totalAmount || 0)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Thời gian khởi tạo</span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">
                          {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Cam kết dịch vụ</span>
                        <span className="text-emerald-600 font-bold mt-0.5 block">SLA 99.9% Uptime</span>
                      </div>
                    </div>

                    {/* Hộp Thông Báo Chờ Kích Hoạt 30 Phút */}
                    {isPendingPayment && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                          <span className="font-semibold">
                            Đơn hàng đang chờ thanh toán. Hạn giữ chỗ còn: <strong className="text-rose-600 font-mono text-sm">{formattedTime}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {isExpired && order.status !== 2 && (
                      <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                        Đơn hàng đã hết hạn giữ chỗ sau 30 phút và tự động hủy. Vui lòng tạo đơn mới để sử dụng dịch vụ.
                      </div>
                    )}
                  </div>

                  {/* Hành Động Dưới Card */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Khách hàng: <strong className="text-slate-800">{order.customerName}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Nút Quét Mã QR Thanh Toán (Cho đơn trong 30 phút) */}
                      {isPendingPayment ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(order)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <span>Quét Mã QR Thanh Toán</span>
                        </button>
                      ) : order.status === 2 ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <span>✓ Đã Kích Hoạt Tự Động</span>
                        </span>
                      ) : (
                        <Link
                          href={`/order?planId=${order.planPriceId || order.planId || ""}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
                        >
                          <span>Đặt Lại Gói Này</span>
                          <span>→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL QUÉT MÃ QR THANH TOÁN CHO ĐƠN TRONG 30 PHÚT (COMPACT & NO SCROLLBAR) */}
        {selectedPayOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-[450px] w-full p-5 sm:p-6 shadow-2xl space-y-3 relative overflow-hidden">
              
              {/* Nút đóng modal */}
              <button
                type="button"
                onClick={() => setSelectedPayOrder(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs cursor-pointer transition-colors"
              >
                ✕
              </button>

              {paymentSuccess ? (
                /* GIAO DIỆN THANH TOÁN THÀNH CÔNG */
                <div className="text-center space-y-3 py-4 animate-in zoom-in-95">
                  <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-600/30">
                    ✓
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Thanh Toán Thành Công!</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Hệ thống đã xác nhận giao dịch thành công cho đơn hàng <strong>{selectedPayOrder.orderCode}</strong>. Gói cước đã chuyển sang trạng thái <strong>Đang Hoạt Động</strong>!
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayOrder(null)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      Đóng & Trở Về Danh Sách Dịch Vụ
                    </button>
                  </div>
                </div>
              ) : (
                /* GIAO DIỆN QUÉT MÃ QR THANH TOÁN GỌN GÀNG */
                <>
                  <div className="text-center space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      <span>CHỜ KÍCH HOẠT (THANH TOÁN)</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      Mã QR Thanh Toán Gói Cước
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Mã đơn: <strong className="text-blue-600 font-mono">{selectedPayOrder.orderCode}</strong> • {selectedPayOrder.planName}
                    </p>
                  </div>

                  {/* Đồng hồ đếm ngược 30 phút */}
                  <div className="py-1.5 px-3 bg-rose-50 border border-rose-200 rounded-xl text-center flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] font-bold text-rose-700">
                      Hạn thanh toán còn lại: <strong className="font-mono text-xs">{Math.floor(modalTimeLeft / 60)}:{(modalTimeLeft % 60).toString().padStart(2, "0")}</strong>
                    </span>
                  </div>

                  {/* Khung Mã QR PayOS Thật */}
                  {loadingQr ? (
                    <div className="p-10 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <div className="w-7 h-7 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-slate-600 font-medium">Đang tải mã QR thanh toán PayOS...</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <div className="inline-block p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            payosData?.accountNumber
                              ? `https://img.vietqr.io/image/${payosData.bin || "970422"}-${payosData.accountNumber}-compact2.png?amount=${Math.round(payosData.amount || selectedPayOrder.price || selectedPayOrder.totalAmount || 0)}&addInfo=${encodeURIComponent(payosData.description || selectedPayOrder.orderCode)}&accountName=${encodeURIComponent(payosData.accountName || "")}`
                              : payosData?.qrCode
                              ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCode)}`
                              : `https://img.vietqr.io/image/970422-0987654321-compact2.png?amount=${Math.round(selectedPayOrder.price || selectedPayOrder.totalAmount || 0)}&addInfo=${encodeURIComponent(selectedPayOrder.orderCode)}`
                          }
                          alt="PayOS VietQR Payment Code"
                          className="w-52 h-52 mx-auto object-contain rounded-lg"
                        />
                        <div className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-wider flex items-center justify-center gap-1">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Mã QR PayOS Tự Động 24/7 (Quét Bằng Mọi Ngân Hàng)</span>
                        </div>
                      </div>

                      {/* Bảng Chi Tiết STK */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] text-left space-y-1.5">
                        {payosData?.accountName && (
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                            <span className="text-slate-500">Chủ tài khoản:</span>
                            <span className="font-bold text-slate-900 uppercase">{payosData.accountName}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                          <span className="text-slate-500">Số tài khoản:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-600 text-xs">
                              {payosData?.accountNumber || "0987654321"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(payosData?.accountNumber || "0987654321");
                                setCheckMessage({ type: "info", text: "Đã sao chép số tài khoản vào bộ nhớ tạm." });
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold cursor-pointer"
                            >
                              Sao chép
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                          <span className="text-slate-500">Số tiền:</span>
                          <span className="font-black text-rose-600 text-xs">
                            {formatPrice(payosData?.amount || selectedPayOrder.price || selectedPayOrder.totalAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Nội dung chuyển khoản:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {payosData?.description || selectedPayOrder.orderCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(payosData?.description || selectedPayOrder.orderCode);
                                setCheckMessage({ type: "info", text: "Đã sao chép nội dung chuyển khoản." });
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold cursor-pointer"
                            >
                              Sao chép
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thông Báo Khi Kiểm Tra */}
                  {checkMessage && (
                    <div
                      className={`p-2.5 rounded-xl text-[11px] font-medium text-left ${
                        checkMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : checkMessage.type === "error"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {checkMessage.text}
                    </div>
                  )}

                  {/* Nút Hành Động */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      disabled={checkingPayment || modalTimeLeft <= 0}
                      onClick={handleManualCheckPayment}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {checkingPayment ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Đang Kiểm Tra Với Hệ Thống Ngân Hàng...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Tôi Đã Chuyển Khoản - Kiểm Tra Kết Quả Giao Dịch</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayOrder(null)}
                      className="w-full py-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Để Thanh Toán Sau (Trong Vòng 30 Phút)
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
