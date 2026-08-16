"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/utils/api";

const PRESET_CATEGORIES = ["Khuyến Mãi", "Sự Kiện", "Hướng Dẫn", "Tin Tức"];

const INITIAL_MOCK_NEWS = [
  {
    id: 1,
    title: "Chương trình khuyến mãi hè rực rỡ - Tặng 30% giá trị nạp",
    summary: "Đón chào mùa hè sôi động, CloudService mang đến chương trình ưu đãi cực lớn cho toàn bộ khách hàng đăng ký mới dịch vụ.",
    content: "Chi tiết ưu đãi: Tặng thêm 30% số tiền nạp tài khoản khi thực hiện giao dịch trong khung giờ vàng từ ngày 15/8 đến 31/8. Chương trình áp dụng tự động cho các gói Cloud VPS Pro và Hosting NVMe từ 6 tháng trở lên.",
    categoryName: "Khuyến Mãi",
    createdAt: "2026-08-10T08:00:00Z"
  },
  {
    id: 2,
    title: "Nâng cấp hạ tầng Datacenters tại Hà Nội và TP.HCM",
    summary: "Nhằm mang lại trải nghiệm tốt nhất, chúng tôi vừa hoàn thành đợt bảo trì nâng cấp băng thông mạng lên 40Gbps.",
    content: "Các kỹ sư mạng tại CloudService đã thực hiện nâng cấp thành công hệ thống chuyển mạch và bổ sung dung lượng băng thông xương sống quốc tế tại hai trung tâm Viettel IDC Sóng Thần và VNPT Nam Thăng Long, nâng tổng dung lượng lên gấp đôi.",
    categoryName: "Sự Kiện",
    createdAt: "2026-08-05T09:30:00Z"
  }
];

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<any[]>(INITIAL_MOCK_NEWS);
  const [loading, setLoading] = useState(true);
  
  // Form/Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryName, setCategoryName] = useState("Tin Tức");
  const [isActive, setIsActive] = useState(true);

  // Load News from API
  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/news?pageSize=100");
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          setArticles(items);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Lỗi API tin tức, chuyển chế độ mock:", err);
    }
    setArticles(INITIAL_MOCK_NEWS);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setTitle("");
    setSummary("");
    setContent("");
    setCategoryName("Tin Tức");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (article: any) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSummary(article.summary || "");
    setContent(article.content);
    setCategoryName(article.categoryName || "Tin Tức");
    setIsActive(article.isActive !== false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !content) {
      alert("Vui lòng nhập đầy đủ các trường thông tin bắt buộc.");
      return;
    }

    const payload = {
      title,
      summary,
      content,
      categoryName,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      isActive
    };

    try {
      if (editingArticle) {
        // Update (PUT)
        const res = await apiFetch(`/api/news/${editingArticle.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert("Cập nhật bài viết thành công!");
          fetchNews();
        } else {
          // Fallback simulation
          setArticles(prev =>
            prev.map(art => (art.id === editingArticle.id ? { ...art, ...payload } : art))
          );
          alert("Lưu bài viết thành công (Chế độ lưu trữ tạm thời).");
        }
      } else {
        // Create (POST)
        const res = await apiFetch("/api/news", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert("Tạo bài viết mới thành công!");
          fetchNews();
        } else {
          // Fallback simulation
          const newArt = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ...payload
          };
          setArticles(prev => [newArt, ...prev]);
          alert("Tạo bài viết mới thành công (Chế độ lưu trữ tạm thời).");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi lưu bài viết.");
    }

    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    const art = articles.find(a => a.id === id);
    if (!art) return;
    const isCurrentlyActive = art.isActive !== false;

    if (!confirm(isCurrentlyActive ? "Bạn có chắc chắn muốn ẩn bài viết này không?" : "Bạn có chắc chắn muốn hiển thị lại bài viết này không?")) return;

    try {
      let res;
      if (isCurrentlyActive) {
        res = await apiFetch(`/api/news/${id}`, {
          method: "DELETE"
        });
      } else {
        res = await apiFetch(`/api/news/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: art.title,
            summary: art.summary,
            content: art.content,
            categoryName: art.categoryName || "Tin Tức",
            slug: art.slug || art.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
            isActive: true
          })
        });
      }
      if (res.ok) {
        alert(isCurrentlyActive ? "Ẩn bài viết thành công!" : "Hiển thị lại bài viết thành công!");
        fetchNews();
      } else {
        setArticles(prev => prev.map(a => a.id === id ? { ...a, isActive: !isCurrentlyActive } : a));
        alert(isCurrentlyActive ? "Ẩn thành công (Chế độ lưu trữ tạm thời)." : "Hiện thành công (Chế độ lưu trữ tạm thời).");
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi cập nhật trạng thái bài viết.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">Quản Lý Tin Tức</h1>
          <p className="text-xs text-slate-400 mt-1">Đăng tải cẩm nang, tài liệu kỹ thuật và khuyến mãi</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors"
        >
          + Viết Bài Mới
        </button>
      </div>

      {/* Articles Listing Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Đang tải danh sách bài viết...</div>
      ) : articles.length === 0 ? (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-xs text-slate-400">
          Chưa có bài viết nào được đăng tải. Nhấn nút viết bài mới để bắt đầu.
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="pb-3">Tiêu đề bài viết</th>
                  <th className="pb-3">Danh mục</th>
                  <th className="pb-3">Ngày đăng</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 pr-4 max-w-sm truncate font-bold text-slate-200">
                      {art.title}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {art.categoryName || "Tin Tức"}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(art.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3.5">
                      {art.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Đang hiện</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Đang ẩn</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(art)}
                        className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-semibold rounded text-blue-400 transition-colors"
                      >
                        Sửa
                      </button>
                      {art.isActive !== false ? (
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-semibold rounded text-red-400 transition-colors"
                          title="Ẩn bài viết"
                        >
                          Ẩn
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-white/5 text-[10px] font-semibold rounded text-green-400 transition-colors"
                          title="Hiện bài viết"
                        >
                          Hiện
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            
            <h2 className="text-base font-bold text-white mb-6">
              {editingArticle ? "Sửa Bài Viết" : "Viết Bài Mới"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Danh mục bài viết</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tóm tắt bài viết (Summary) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tóm tắt ngắn gọn hiển thị trên trang tin tức..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nội dung chi tiết (Hỗ trợ Markdown) *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Nội dung chi tiết viết tại đây..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {editingArticle && (
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="newsIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-950 border-white/10 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="newsIsActive" className="text-xs font-semibold text-slate-300">Hiển thị bài viết</label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition-colors"
                >
                  Lưu Bài Viết
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
