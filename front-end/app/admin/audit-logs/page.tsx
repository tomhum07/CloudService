"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
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
        if (Array.isArray(items)) {
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
      console.warn("Lỗi lấy nhật ký hệ thống:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.actor && log.actor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ip && log.ip.includes(searchTerm));
    const matchesType = selectedType === "Tất cả" || log.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const displayedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-4 px-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900">Nhật Ký Hoạt Động & Bảo Mật</h1>
          <p className="text-xs text-slate-500 mt-0.5">Truy vết hành vi thực tế đăng nhập, thay đổi giá và thao tác quản trị viên</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? "Đang cập nhật..." : "Làm mới nhật ký"}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {typesList.map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedType(t);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedType === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm theo người thực hiện, thao tác, IP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Tài Khoản</th>
                <th className="py-3.5 px-4">Hành Động / Thao Tác</th>
                <th className="py-3.5 px-4">Địa Chỉ IP</th>
                <th className="py-3.5 px-4">Phân Loại</th>
                <th className="py-3.5 px-4">Kết Quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Đang tải nhật ký hệ thống...</td>
                </tr>
              ) : displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Chưa có bản ghi nhật ký nào.</td>
                </tr>
              ) : (
                displayedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor}</td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{log.action}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-600">{log.ip}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === "Thành công"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : log.status === "Cảnh báo"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Trang {currentPage} / {totalPages} ({filteredLogs.length} bản ghi)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded-lg"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
