"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

const INITIAL_LOGS = [
  { id: 1, timestamp: "2026-08-16 14:35:12", actor: "admin@cloudservice.vn", action: "Phê duyệt đơn hàng ORD-94812 (VPS Pro)", ip: "14.232.89.4", type: "Đơn Hàng", status: "Thành công" },
  { id: 2, timestamp: "2026-08-16 14:32:05", actor: "system", action: "Nhận yêu cầu đặt hàng mới ORD-94812 từ KH Nguyễn Văn Hùng", ip: "113.23.45.101", type: "Đơn Hàng", status: "Thành công" },
  { id: 3, timestamp: "2026-08-16 13:10:45", actor: "editor@cloudservice.vn", action: "Tạo bài viết tin tức: 'Chương trình khuyến mãi hè rực rỡ'", ip: "115.79.40.12", type: "Tin Tức", status: "Thành công" },
  { id: 4, timestamp: "2026-08-16 11:15:20", actor: "system", action: "Nhận yêu cầu đặt hàng mới ORD-20491 từ KH Lê Văn Tám", ip: "27.72.105.42", type: "Đơn Hàng", status: "Thành công" },
  { id: 5, timestamp: "2026-08-16 09:00:00", actor: "admin@cloudservice.vn", action: "Đăng nhập hệ thống quản trị", ip: "14.232.89.4", type: "Bảo Mật", status: "Thành công" },
  { id: 6, timestamp: "2026-08-15 22:45:10", actor: "system", action: "Gửi cảnh báo sử dụng CPU vượt ngưỡng 90% trên node-04", ip: "127.0.0.1", type: "Hệ Thống", status: "Cảnh báo" },
  { id: 7, timestamp: "2026-08-15 18:42:30", actor: "admin@cloudservice.vn", action: "Phê duyệt đơn hàng ORD-30194 (VPS Starter)", ip: "14.232.89.4", type: "Đơn Hàng", status: "Thành công" },
  { id: 8, timestamp: "2026-08-15 15:30:15", actor: "unknown", action: "Đăng nhập hệ thống thất bại (Sai mật khẩu)", ip: "103.45.201.88", type: "Bảo Mật", status: "Thất bại" }
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const typesList = ["Tất cả", "Bảo Mật", "Đơn Hàng", "Tin Tức", "Hệ Thống"];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/audit-logs?pageSize=100");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          setLogs(items.map((l: any) => ({
            id: l.id,
            timestamp: new Date(l.timestamp).toLocaleString("vi-VN"),
            actor: l.username || "system",
            action: l.action,
            ip: l.payload || "127.0.0.1",
            type: l.type || "Hệ Thống",
            status: l.status || "Thành công"
          })));
        }
      }
    } catch (err) {
      console.warn("Failed to load audit logs, using initial dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);
    
    const matchesType = selectedType === "Tất cả" || log.type === selectedType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Nhật Ký Hệ Thống (Audit Logs)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Theo dõi chi tiết các thao tác quản trị, truy cập và lịch sử biến động dữ liệu.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900 p-4 rounded-xl border border-white/5 items-center">
        {/* Type tabs */}
        <div className="lg:col-span-2 flex flex-wrap gap-1.5">
          {typesList.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedType(t);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                selectedType === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Tìm kiếm tác nhân, hành động, IP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold">
                <th className="pb-3">Thời gian</th>
                <th className="pb-3">Tác nhân</th>
                <th className="pb-3">Loại</th>
                <th className="pb-3">Hành động</th>
                <th className="pb-3">Địa chỉ IP / Chi tiết</th>
                <th className="pb-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    Không tìm thấy bản ghi nhật ký nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-200">{log.actor}</td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium text-[10px]">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-300 max-w-sm truncate">{log.action}</td>
                    <td className="py-3.5 font-mono text-[10px] text-slate-400">{log.ip}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "Thành công"
                          ? "bg-green-950 text-green-400"
                          : log.status === "Cảnh báo"
                          ? "bg-yellow-950 text-yellow-400"
                          : "bg-red-950 text-red-400"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/5 text-slate-400 text-xs mt-4">
              <div>Trang {currentPage}/{totalPages} — {filteredLogs.length} bản ghi</div>
              <div className="flex gap-2">
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Đầu</button>
                <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Trước</button>
                <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Sau</button>
                <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-medium transition-colors">Cuối</button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
