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
      console.warn("Lỗi lấy nhật ký hệ thống:", err);
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
  const displayedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Nhật Ký Hoạt Động & Bảo Mật</h1>
          <p className="text-xs text-slate-500 mt-1">Truy vết hành vi đăng nhập, thay đổi giá và thao tác quản trị viên</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl transition-colors shadow-sm shadow-blue-500/20"
        >
          🔄 {loading ? "Đang cập nhật..." : "Làm mới nhật ký"}
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

        <input
          type="text"
          placeholder="Tìm kiếm theo người thực hiện, thao tác, IP..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full md:w-80 h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
        />
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
              {displayedLogs.map((log) => (
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
              ))}
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
