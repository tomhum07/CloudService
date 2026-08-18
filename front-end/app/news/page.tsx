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
  const [categoriesList, setCategoriesList] = useState<string[]>(["Tất cả", "Khuyến Mãi", "Sự Kiện", "Hướng Dẫn"]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        let url = `/api/news?pageNumber=${currentPage}&pageSize=9`;
        if (searchTerm.trim()) {
          url += `&search=${encodeURIComponent(searchTerm.trim())}`;
        }
        if (selectedCategory && selectedCategory !== "Tất cả") {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        const res = await apiFetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          if (Array.isArray(items) && items.length > 0) {
            setNews(items);
            if (data.totalPages) setTotalPages(data.totalPages);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Dùng dữ liệu tin tức mẫu.");
      }

      // Fallback filter
      let filtered = MOCK_ALL_NEWS;
      if (selectedCategory !== "Tất cả") {
        filtered = filtered.filter(n => n.categoryName === selectedCategory);
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filtered = filtered.filter(n => n.title.toLowerCase().includes(query) || n.summary.toLowerCase().includes(query));
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
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <span className="text-blue-600 font-bold">Tin tức & Sự kiện</span>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-3">Thông Tin & Cẩm Nang</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Tin Tức & Sự Kiện Công Nghệ
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Khám phá các cẩm nang, tài liệu hướng dẫn kỹ thuật, tin khuyến mãi và cập nhật tính năng mới nhất từ CloudService.
          </p>
        </div>

        {/* Search & Category filter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Categories */}
          <div className="lg:col-span-2 flex flex-wrap gap-2 items-center">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">Đang tải tin tức...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm bg-white border border-slate-200 rounded-2xl">
            Không tìm thấy bài viết nào phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all shadow-sm group">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {item.categoryName || item.category || "Tin Tức"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-6">
                    {item.summary || item.content}
                  </p>
                </div>
                <Link
                  href={`/news/${item.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 text-center text-xs font-bold text-blue-600 transition-all block"
                >
                  Đọc Chi Tiết →
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Đang tải...</div>}>
      <NewsContent />
    </Suspense>
  );
}
