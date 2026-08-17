"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";
import { useSearchParams, useRouter } from "next/navigation";

// Fallback Mock News Data
const MOCK_ALL_NEWS = [
  {
    id: 1,
    title: "Chương trình khuyến mãi hè rực rỡ - Tặng 30% giá trị nạp",
    summary: "Đón chào mùa hè sôi động, CloudService mang đến chương trình ưu đãi cực lớn cho toàn bộ khách hàng đăng ký mới dịch vụ.",
    content: "Chi tiết ưu đãi: Tặng thêm 30% số tiền nạp tài khoản khi thực hiện giao dịch trong khung giờ vàng từ ngày 15/8 đến 31/8. Chương trình áp dụng tự động cho các gói Cloud VPS Pro và Hosting NVMe từ 6 tháng trở lên.",
    createdAt: "2026-08-10T08:00:00Z",
    categoryName: "Khuyến Mãi"
  },
  {
    id: 2,
    title: "Nâng cấp hạ tầng Datacenters tại Hà Nội và TP.HCM",
    summary: "Nhằm mang lại trải nghiệm tốt nhất, chúng tôi vừa hoàn thành đợt bảo trì nâng cấp băng thông mạng lên 40Gbps.",
    content: "Các kỹ sư mạng tại CloudService đã thực hiện nâng cấp thành công hệ thống chuyển mạch và bổ sung dung lượng băng thông xương sống quốc tế tại hai trung tâm Viettel IDC Sóng Thần và VNPT Nam Thăng Long, nâng tổng dung lượng lên gấp đôi.",
    createdAt: "2026-08-05T09:30:00Z",
    categoryName: "Sự Kiện"
  },
  {
    id: 3,
    title: "Hướng dẫn cài đặt SSL miễn phí trên Cloud Hosting",
    summary: "Bài viết này hướng dẫn chi tiết các bước kích hoạt chứng chỉ Let's Encrypt SSL tự động chỉ với 1 click chuột.",
    content: "Để bảo mật thông tin truyền tải giữa người dùng và máy chủ, chứng chỉ SSL là bắt buộc. Trong cPanel của CloudService, bạn chỉ cần tìm biểu tượng Let's Encrypt SSL, nhấn Issue và hệ thống sẽ tự động hoàn tất cấu hình trong 30 giây.",
    createdAt: "2026-08-01T14:00:00Z",
    categoryName: "Hướng Dẫn"
  },
  {
    id: 4,
    title: "Chính sách hoa hồng Affiliate cực khủng dành cho Cộng Tác Viên",
    summary: "Nhận hoa hồng trọn đời lên đến 20% trên mỗi đơn hàng gia hạn thành công của khách hàng giới thiệu.",
    content: "Đồng hành phát triển cùng CloudService, bạn sẽ được cấp một liên kết giới thiệu (Affiliate Link) riêng biệt. Khi có khách hàng đăng ký qua link, bạn nhận ngay 20% phí giao dịch ban đầu và tiếp tục hưởng 10% cho mỗi lần gia hạn trọn đời.",
    createdAt: "2026-07-28T10:00:00Z",
    categoryName: "Khuyến Mãi"
  },
  {
    id: 5,
    title: "Phòng chống các cuộc tấn công DDoS Layer 7 hiệu quả",
    summary: "Tìm hiểu cơ chế bảo mật firewall thông minh của CloudService chống lại spam http request diện rộng.",
    content: "Tấn công Layer 7 nhắm thẳng vào tài nguyên máy chủ ứng dụng web. Bằng cách áp dụng bộ lọc Rate-Limiting và kiểm tra thử thách Javascript, hệ thống Firewall của chúng tôi chặn đứng các botnet độc hại mà không ảnh hưởng tới khách truy cập.",
    createdAt: "2026-07-20T16:00:00Z",
    categoryName: "Hướng Dẫn"
  }
];

function NewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "Tất cả";

  const [news, setNews] = useState<any[]>(MOCK_ALL_NEWS);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoriesList = ["Tất cả", "Khuyến Mãi", "Sự Kiện", "Hướng Dẫn"];

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        const catQuery = selectedCategory !== "Tất cả" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
        const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
        const res = await apiFetch(`/api/news?page=${currentPage}&pageSize=6${searchQuery}${catQuery}`);
        
        if (res.ok) {
          const data = await res.json();
          // Backend returns PagedNewsResult: { items: [...], totalCount: 15, page: 1, pageSize: 6 }
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            const activeItems = data.items.filter((n: any) => n.isActive !== false);
            setNews(activeItems);
            setTotalPages(Math.ceil(data.totalCount / 6) || 1);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Lỗi tải tin tức từ API:", err);
      }

      // Local Mock Filter Fallback
      let filtered = MOCK_ALL_NEWS.filter((n: any) => n.isActive !== false);
      if (selectedCategory !== "Tất cả") {
        filtered = filtered.filter((n) => n.categoryName === selectedCategory);
      }
      if (searchTerm) {
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.summary.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setNews(filtered);
      setTotalPages(1);
      setLoading(false);
    }

    loadNews();
  }, [searchTerm, selectedCategory, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest block mb-3">Thông tin đa chiều</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Tin Tức & Sự Kiện Công Nghệ
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Khám phá các cẩm nang, tài liệu hướng dẫn lập trình, tin khuyến mãi và cập nhật kỹ thuật từ CloudService.
          </p>
        </div>

        {/* Search & Category filter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Categories */}
          <div className="lg:col-span-2 flex flex-wrap gap-2 items-center">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-white/5 transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Đang tải tin tức...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm bg-slate-900/50 border border-white/5 rounded-2xl">
            Không tìm thấy bài viết nào phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div key={item.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
                    <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">{item.categoryName || "Tin Tức"}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-3 line-clamp-2 hover:text-blue-400 transition-colors">
                    <Link href={`/news/${item.id}`}>{item.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {item.summary}
                  </p>
                </div>
                <Link
                  href={`/news/${item.id}`}
                  className="text-xs font-semibold text-blue-400 hover:underline mt-auto inline-block"
                >
                  Đọc tiếp →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-slate-900 text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              Trang Trước
            </button>
            <span className="text-xs text-slate-400">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-slate-900 text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              Trang Sau
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Đang tải trang tin tức...</div>}>
      <NewsContent />
    </Suspense>
  );
}
