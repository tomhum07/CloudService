/**
 * Supabase Storage Configuration & Direct Uploader
 * Cấu hình trực tiếp trong code và hỗ trợ đọc qua biến môi trường .env
 */

// Cấu hình cố định trực tiếp trong Code (Bạn có thể thay URL & Key của dự án tại đây)
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfdtrcwyfgtygtdqfcf.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZmR0cmN3eWZndHlndGRxZmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMyNTY4NDEsImV4cCI6MjAzODgzMjg0MX0.YOUR_ANON_KEY_OR_ENV";
export const DEFAULT_BUCKET = "news-images";

export interface UploadResult {
  url: string;
  fileName: string;
  error?: string;
}

/**
 * Tải file hình ảnh trực tiếp lên Supabase Storage bucket
 * @param file Đối tượng File từ thẻ <input type="file" />
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: string = DEFAULT_BUCKET
): Promise<UploadResult> {
  const url = SUPABASE_URL.replace(/\/$/, "");
  const anonKey = SUPABASE_ANON_KEY;

  if (!url) {
    return { url: "", fileName: "", error: "Chưa cấu hình Supabase URL." };
  }

  // Tạo tên file ngẫu nhiên an toàn: timestamp-filename.ext
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
    return { url: "", fileName: "", error: err.message || "Lỗi mạng khi tải ảnh lên Supabase." };
  }
}
