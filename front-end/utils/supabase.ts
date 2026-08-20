/**
 * Supabase Storage Configuration & Direct Uploader Utility
 * Cấu hình bảo mật an toàn qua Biến Môi Trường (Environment Variables) .env.local
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfdtrcwyfgtygtdqfcf.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "news-images";

export interface UploadResult {
  url: string;
  fileName: string;
  error?: string;
}

/**
 * Tải file hình ảnh trực tiếp từ trình duyệt lên Supabase Storage bucket (Zero server-storage)
 * @param file Đối tượng File từ thẻ <input type="file" />
 * @param bucket Tên bucket (Mặc định: news-images)
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: string = DEFAULT_BUCKET
): Promise<UploadResult> {
  const url = (SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = SUPABASE_ANON_KEY;

  if (!url) {
    return { url: "", fileName: "", error: "Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL." };
  }

  // Tạo tên file ngẫu nhiên an toàn: timestamp-cleanname.ext
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 30);
  const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
  const uploadPath = `uploads/${fileName}`;

  try {
    const uploadEndpoint = `${url}/storage/v1/object/${bucket}/${uploadPath}`;

    const headers: Record<string, string> = {
      "Content-Type": file.type || "image/jpeg"
    };

    if (anonKey) {
      headers["apikey"] = anonKey;
      headers["Authorization"] = `Bearer ${anonKey}`;
    }

    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers,
      body: file
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.message || errData.error || `Upload thất bại (HTTP ${res.status})`;
      return { url: "", fileName: "", error: msg };
    }

    // Đường dẫn Public URL của file vừa upload
    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${uploadPath}`;
    return { url: publicUrl, fileName };
  } catch (err: any) {
    return { url: "", fileName: "", error: err.message || "Lỗi kết nối khi tải ảnh lên Supabase." };
  }
}
