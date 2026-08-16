"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/utils/api";

const MOCK_ALL_NEWS = [
  {
    id: 1,
    title: "Chương trình khuyến mãi hè rực rỡ - Tặng 30% giá trị nạp",
    summary: "Đón chào mùa hè sôi động, CloudService mang đến chương trình ưu đãi cực lớn cho toàn bộ khách hàng đăng ký mới dịch vụ.",
    content: "Chi tiết ưu đãi: Tặng thêm 30% số tiền nạp tài khoản khi thực hiện giao dịch trong khung giờ vàng từ ngày 15/8 đến 31/8. Chương trình áp dụng tự động cho các gói Cloud VPS Pro và Hosting NVMe từ 6 tháng trở lên. Mọi thắc mắc vui lòng liên hệ bộ phận chăm sóc khách hàng hoặc gửi email đến sales@cloudservice.vn.",
    createdAt: "2026-08-10T08:00:00Z",
    categoryName: "Khuyến Mãi"
  },
  {
    id: 2,
    title: "Nâng cấp hạ tầng Datacenters tại Hà Nội và TP.HCM",
    summary: "Nhằm mang lại trải nghiệm tốt nhất, chúng tôi vừa hoàn thành đợt bảo trì nâng cấp băng thông mạng lên 40Gbps.",
    content: "Các kỹ sư mạng tại CloudService đã thực hiện nâng cấp thành công hệ thống chuyển mạch và bổ sung dung lượng băng thông xương sống quốc tế tại hai trung tâm Viettel IDC Sóng Thần và VNPT Nam Thăng Long, nâng tổng dung lượng lên gấp đôi. Đợt nâng cấp này cam kết giảm độ trễ (latency) khi truy cập quốc tế thêm 15-20% và tăng tính chịu tải hệ thống khi có lưu lượng tăng đột biến.",
    createdAt: "2026-08-05T09:30:00Z",
    categoryName: "Sự Kiện"
  },
  {
    id: 3,
    title: "Hướng dẫn cài đặt SSL miễn phí trên Cloud Hosting",
    summary: "Bài viết này hướng dẫn chi tiết các bước kích hoạt chứng chỉ Let's Encrypt SSL tự động chỉ với 1 click chuột.",
    content: "Để bảo mật thông tin truyền tải giữa người dùng và máy chủ, chứng chỉ SSL là bắt buộc. Trong cPanel của CloudService, bạn chỉ cần tìm biểu tượng Let's Encrypt SSL, nhấn Issue và hệ thống sẽ tự động hoàn tất cấu hình trong 30 giây. Sau khi cài đặt thành công, website của bạn sẽ tự động chuyển hướng từ http:// sang https:// với biểu tượng ổ khóa an toàn.",
    createdAt: "2026-08-01T14:00:00Z",
    categoryName: "Hướng Dẫn"
  },
  {
    id: 4,
    title: "Chính sách hoa hồng Affiliate cực khủng dành cho Cộng Tác Viên",
    summary: "Nhận hoa hồng trọn đời lên đến 20% trên mỗi đơn hàng gia hạn thành công của khách hàng giới thiệu.",
    content: "Đồng hành phát triển cùng CloudService, bạn sẽ được cấp một liên kết giới thiệu (Affiliate Link) riêng biệt. Khi có khách hàng đăng ký qua link, bạn nhận ngay 20% phí giao dịch ban đầu và tiếp tục hưởng 10% cho mỗi lần gia hạn trọn đời. Tiền hoa hồng sẽ được đối soát hằng tháng và chi trả trực tiếp qua tài khoản ngân hàng từ ngày 5 đến ngày 10 hàng tháng.",
    createdAt: "2026-07-28T10:00:00Z",
    categoryName: "Khuyến Mãi"
  },
  {
    id: 5,
    title: "Phòng chống các cuộc tấn công DDoS Layer 7 hiệu quả",
    summary: "Tìm hiểu cơ chế bảo mật firewall thông minh của CloudService chống lại spam http request diện rộng.",
    content: "Tấn công Layer 7 nhắm thẳng vào tài nguyên máy chủ ứng dụng web (như HTTP GET/POST flood). Bằng cách áp dụng bộ lọc Rate-Limiting tiên tiến và kiểm tra thử thách Javascript thông minh, hệ thống Firewall của chúng tôi chặn đứng các botnet độc hại mà không hề gây bất cứ phiền hà nào cho khách hàng truy cập bình thường.",
    createdAt: "2026-07-20T16:00:00Z",
    categoryName: "Hướng Dẫn"
  }
];

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;
  const idNum = parseInt(idStr, 10);

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await apiFetch(`/api/news/${idStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title && data.isActive !== false) {
            setArticle(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết bài viết từ API:", err);
      }

      // Local Fallback
      const found = MOCK_ALL_NEWS.find((n) => n.id === idNum && (n as any).isActive !== false);
      setArticle(found || null);
      setLoading(false);
    }

    loadArticle();
  }, [idStr, idNum]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="text-sm text-slate-400">Đang tải nội dung bài viết...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-24 px-6 text-center">
        <div className="max-w-md mx-auto bg-slate-900 border border-white/5 p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Không tìm thấy bài viết</h2>
          <p className="text-xs text-slate-400 mb-6">
            Bài viết bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center justify-center px-6 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
          >
            Quay lại Tin tức
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-6">
      <article className="max-w-3xl mx-auto">
        {/* Navigation breadcrumb */}
        <div className="mb-8 text-xs text-slate-500 flex items-center gap-2">
          <Link href="/news" className="hover:text-blue-400">Tin tức</Link>
          <span>/</span>
          <span className="text-slate-400 truncate">{article.title}</span>
        </div>

        {/* Article Meta */}
        <div className="mb-6">
          <span className="px-2.5 py-1 rounded bg-blue-900/40 text-blue-300 text-xs font-semibold uppercase tracking-wide">
            {article.categoryName || "Tin Tức"}
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white mt-4 mb-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-xs text-slate-500">
            Đăng ngày {new Date(article.createdAt).toLocaleDateString("vi-VN")} • Tác giả: Ban Biên Tập CloudService
          </p>
        </div>

        {/* Article Summary */}
        <div className="bg-slate-900 border-l-4 border-blue-600 p-4 rounded-r-xl mb-8">
          <p className="text-xs md:text-sm font-medium text-slate-300 leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* Article Content */}
        <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed space-y-6 text-xs md:text-sm border-t border-white/5 pt-8">
          {article.content.split("\n\n").map((para: string, idx: number) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Share/Footer action */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/news"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Quay lại danh sách tin tức
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Đã sao chép liên kết bài viết vào Clipboard!");
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs text-slate-300 transition-colors"
          >
            Chia sẻ bài viết
          </button>
        </div>
      </article>
    </div>
  );
}
