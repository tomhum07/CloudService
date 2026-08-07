const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5074"; // Địa chỉ HTTP của Backend

let inMemoryToken = "";
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string) {
  inMemoryToken = token;
}

export function getAccessToken() {
  return inMemoryToken;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Clone options và định nghĩa headers chắc chắn không bị undefined
  const fetchOptions = {
    ...options,
    headers: {
      ...options.headers,
    } as Record<string, string>,
    credentials: "include" as const
  };

  // Chỉ thiết lập Content-Type mặc định nếu không phải là FormData
  if (!(options.body instanceof FormData)) {
    fetchOptions.headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };
  }

  // Đính kèm Access Token trong Header Authorization nếu có
  if (inMemoryToken) {
    fetchOptions.headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }

  let response = await fetch(url, fetchOptions);

  // Cơ chế tự động làm mới Token (Silent Refresh) nếu Access Token hết hạn (Lỗi 401)
  if (response.status === 401 && endpoint !== "/api/auth/login" && endpoint !== "/api/auth/refresh-token") {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Gọi lại request ban đầu với token mới
      fetchOptions.headers["Authorization"] = `Bearer ${inMemoryToken}`;
      response = await fetch(url, fetchOptions);
    } else {
      // Nếu Refresh Token cũng hết hạn, chuyển hướng về trang login
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  }

  return response;
}

export async function refreshAccessToken(): Promise<boolean> {
  // Nếu đang có một tiến trình refresh chạy song song, dùng chung Promise đó để tránh race condition
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include" // Gửi kèm cookie refresh token
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          return true;
        }
      }
    } catch (error) {
      console.error("Lỗi tự động gia hạn token:", error);
    }
    return false;
  })();

  const result = await refreshPromise;
  refreshPromise = null; // Reset lại khóa sau khi đã có kết quả
  return result;
}
